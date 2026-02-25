# -*- coding: utf-8 -*-
# Copyright (c) 2026, Genii Development and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _

class GeniiCallList(Document):
    def validate(self):
        """Validate and update lead count before saving"""
        self.lead_count = len(self.leads) if self.leads else 0

        # Ensure salesperson has permission
        if self.salesperson != frappe.session.user:
            if not frappe.has_permission("Genii Call List", "write"):
                frappe.throw(_("You can only create call lists for yourself"))

    def before_save(self):
        """Update lead count and validate unique leads"""
        self.lead_count = len(self.leads) if self.leads else 0

        # Check for duplicate leads in the same call list
        lead_ids = [lead.lead for lead in self.leads]
        if len(lead_ids) != len(set(lead_ids)):
            frappe.throw(_("Duplicate leads found in call list"))

    def on_update(self):
        """Update lead information from linked Lead doctype"""
        for lead in self.leads:
            if lead.lead:
                lead_doc = frappe.get_doc("Lead", lead.lead)
                lead.lead_name = lead_doc.lead_name
                lead.phone = lead_doc.phone
                lead.mobile = lead_doc.mobile_no
                lead.city = lead_doc.city
                lead.state = lead_doc.state
                lead.lead_source = lead_doc.source


@frappe.whitelist()
def get_my_call_list(date=None, salesperson=None):
    """
    Get call list for the specified salesperson and date

    Args:
        date (str): Date in YYYY-MM-DD format (defaults to today)
        salesperson (str): User email (defaults to current user)

    Returns:
        dict: Call list data with leads
    """
    if not date:
        date = frappe.utils.today()

    if not salesperson:
        salesperson = frappe.session.user

    # Check permissions
    if salesperson != frappe.session.user:
        if not frappe.has_permission("Genii Call List", "read"):
            frappe.throw(_("You don't have permission to view other users' call lists"))

    # Find or create call list for the date
    call_lists = frappe.get_all(
        "Genii Call List",
        filters={"salesperson": salesperson, "date": date},
        fields=["name", "status", "lead_count"],
        limit=1
    )

    if not call_lists:
        return {
            "success": False,
            "message": "No call list found for this date",
            "data": None
        }

    # Get full call list with leads
    call_list = frappe.get_doc("Genii Call List", call_lists[0].name)

    # Format leads data
    leads_data = []
    for lead in call_list.leads:
        leads_data.append({
            "name": lead.name,
            "lead": lead.lead,
            "lead_name": lead.lead_name,
            "phone": lead.phone,
            "mobile": lead.mobile,
            "property_address": lead.property_address,
            "city": lead.city,
            "state": lead.state,
            "lead_score": lead.lead_score,
            "lead_source": lead.lead_source,
            "adu_potential": lead.adu_potential,
            "deal_stage": lead.deal_stage,
            "status": lead.status,
            "notes": lead.notes,
            "last_contacted": lead.last_contacted
        })

    return {
        "success": True,
        "data": {
            "name": call_list.name,
            "salesperson": call_list.salesperson,
            "date": call_list.date,
            "status": call_list.status,
            "lead_count": call_list.lead_count,
            "leads": leads_data
        }
    }


@frappe.whitelist()
def update_lead_status(lead_name, status=None, notes=None):
    """
    Update status and notes for a call list lead

    Args:
        lead_name (str): Name of the Genii Call List Lead record
        status (str): New status (optional)
        notes (str): Updated notes (optional)

    Returns:
        dict: Success message
    """
    try:
        # Get the call list lead
        lead = frappe.get_doc("Genii Call List Lead", lead_name)

        # Get parent call list to check permissions
        call_list = frappe.get_doc("Genii Call List", lead.parent)

        if call_list.salesperson != frappe.session.user:
            if not frappe.has_permission("Genii Call List", "write"):
                frappe.throw(_("You don't have permission to update this lead"))

        # Update fields
        if status:
            lead.status = status

        if notes:
            lead.notes = notes

        # Update last contacted timestamp
        lead.last_contacted = frappe.utils.now()

        # Save the parent document (which saves child table)
        call_list.save(ignore_permissions=True)

        return {
            "success": True,
            "message": "Lead updated successfully",
            "data": {
                "lead_name": lead.lead_name,
                "status": lead.status,
                "notes": lead.notes,
                "last_contacted": lead.last_contacted
            }
        }

    except Exception as e:
        frappe.log_error(f"Error updating lead status: {str(e)}")
        return {
            "success": False,
            "message": str(e)
        }


@frappe.whitelist()
def log_call_attempt(lead_name, outcome, notes=None):
    """
    Log a call attempt to CRM Communication and update lead status

    Args:
        lead_name (str): Name of the Lead in CRM
        outcome (str): Call outcome (Called/Interested/Not Interested/Callback)
        notes (str): Call notes

    Returns:
        dict: Success message
    """
    try:
        # Create Communication record
        comm = frappe.get_doc({
            "doctype": "Communication",
            "communication_type": "Communication",
            "communication_medium": "Phone",
            "sent_or_received": "Sent",
            "reference_doctype": "Lead",
            "reference_name": lead_name,
            "subject": f"Call - {outcome}",
            "content": notes or f"Call outcome: {outcome}",
            "status": "Linked",
            "sender": frappe.session.user
        })
        comm.insert(ignore_permissions=True)

        # Update Lead status if applicable
        lead = frappe.get_doc("Lead", lead_name)

        if outcome == "Interested":
            lead.status = "Interested"
        elif outcome == "Not Interested":
            lead.status = "Do Not Contact"

        lead.save(ignore_permissions=True)

        return {
            "success": True,
            "message": "Call logged successfully",
            "data": {
                "communication": comm.name,
                "lead_status": lead.status
            }
        }

    except Exception as e:
        frappe.log_error(f"Error logging call: {str(e)}")
        return {
            "success": False,
            "message": str(e)
        }


@frappe.whitelist()
def auto_create_daily_call_lists():
    """
    Scheduled task to automatically create daily call lists for all salespeople
    Runs every morning to prepare leads for the day
    """
    from frappe.utils import today, add_days

    # Get all active sales users
    sales_users = frappe.get_all(
        "User",
        filters={
            "enabled": 1,
            "role_profile_name": ["in", ["Sales User", "Sales Manager"]]
        },
        fields=["name", "email"]
    )

    date = today()

    for user in sales_users:
        # Check if call list already exists
        existing = frappe.db.exists("Genii Call List", {
            "salesperson": user.email,
            "date": date
        })

        if not existing:
            # Get qualified leads for this salesperson
            leads = frappe.get_all(
                "Lead",
                filters={
                    "status": ["in", ["Lead", "Open", "Interested"]],
                    "lead_owner": user.email
                },
                fields=["name", "lead_name", "phone", "mobile_no", "city", "state"],
                limit=50
            )

            if leads:
                # Create call list
                call_list = frappe.get_doc({
                    "doctype": "Genii Call List",
                    "salesperson": user.email,
                    "date": date,
                    "status": "Draft",
                    "leads": [
                        {
                            "lead": lead.name,
                            "lead_name": lead.lead_name,
                            "phone": lead.phone,
                            "mobile": lead.mobile_no,
                            "city": lead.city,
                            "state": lead.state,
                            "status": "New"
                        }
                        for lead in leads
                    ]
                })
                call_list.insert(ignore_permissions=True)
                frappe.db.commit()
