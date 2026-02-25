// CRM Lead List View Customization for Genii Call List
// Adds additional columns, filters, and "My Leads Today" preset

frappe.listview_settings['Lead'] = {
    // Add custom columns to the list view
    add_fields: ["phone", "mobile_no", "city", "state", "lead_owner", "source"],
    
    // Custom column formatters
    formatters: {
        phone: function(value) {
            if (value) {
                return `<a href="tel:${value}" class="text-primary"><i class="fa fa-phone"></i> ${value}</a>`;
            }
            return '';
        },
        mobile_no: function(value) {
            if (value) {
                return `<a href="tel:${value}" class="text-primary"><i class="fa fa-mobile"></i> ${value}</a>`;
            }
            return '';
        }
    },
    
    // Custom filters
    onload: function(listview) {
        // Add "My Leads Today" filter preset
        listview.page.add_inner_button(__('My Leads Today'), function() {
            listview.filter_area.clear();
            
            listview.filter_area.add([
                ["Lead", "lead_owner", "=", frappe.session.user],
                ["Lead", "status", "in", ["Lead", "Open", "Interested"]],
                ["Lead", "creation", ">=", frappe.datetime.add_days(frappe.datetime.now_date(), -1)]
            ]);
        }, __('Filters'));
        
        // Add "High Priority" filter
        listview.page.add_inner_button(__('High Priority'), function() {
            listview.filter_area.clear();
            
            listview.filter_area.add([
                ["Lead", "lead_owner", "=", frappe.session.user],
                ["Lead", "status", "in", ["Lead", "Interested"]]
            ]);
        }, __('Filters'));
        
        // Add "Create Call List" button
        listview.page.add_button(__('Create Call List'), function() {
            create_call_list_from_leads(listview);
        }, {
            icon: 'phone',
            btn_class: 'btn-primary'
        });
        
        // Add custom indicator for ADU potential (if custom field exists)
        listview.page.add_field({
            fieldtype: 'Check',
            label: __('ADU Potential Only'),
            fieldname: 'adu_potential_filter',
            onchange: function() {
                if (this.get_value()) {
                    listview.filter_area.add([
                        ["Lead", "adu_potential", "=", 1]
                    ]);
                } else {
                    listview.refresh();
                }
            }
        });
    },
    
    // Custom list item rendering
    get_indicator: function(doc) {
        // Color-code leads by status
        const status_colors = {
            "Lead": "blue",
            "Open": "orange",
            "Interested": "green",
            "Qualified": "green",
            "Converted": "green",
            "Do Not Contact": "red",
            "Lost": "red"
        };
        
        return [__(doc.status), status_colors[doc.status] || "gray", "status,=," + doc.status];
    }
};

// Function to create a call list from selected leads
function create_call_list_from_leads(listview) {
    const selected_leads = listview.get_checked_items();
    
    if (selected_leads.length === 0) {
        frappe.msgprint(__('Please select at least one lead'));
        return;
    }
    
    // Create dialog to configure call list
    const dialog = new frappe.ui.Dialog({
        title: __('Create Call List'),
        fields: [
            {
                fieldtype: 'Link',
                label: __('Salesperson'),
                fieldname: 'salesperson',
                options: 'User',
                default: frappe.session.user,
                reqd: 1
            },
            {
                fieldtype: 'Date',
                label: __('Date'),
                fieldname: 'date',
                default: frappe.datetime.now_date(),
                reqd: 1
            },
            {
                fieldtype: 'Select',
                label: __('Status'),
                fieldname: 'status',
                options: 'Draft\nActive',
                default: 'Draft',
                reqd: 1
            },
            {
                fieldtype: 'HTML',
                fieldname: 'lead_preview',
                options: `<div class="text-muted">
                    <p><strong>${selected_leads.length}</strong> leads selected</p>
                </div>`
            }
        ],
        primary_action_label: __('Create Call List'),
        primary_action: function(values) {
            // Prepare lead data
            const leads_data = selected_leads.map(lead => {
                return {
                    lead: lead.name,
                    status: 'New'
                };
            });
            
            // Create the call list document
            frappe.call({
                method: 'frappe.client.insert',
                args: {
                    doc: {
                        doctype: 'Genii Call List',
                        salesperson: values.salesperson,
                        date: values.date,
                        status: values.status,
                        leads: leads_data
                    }
                },
                callback: function(r) {
                    if (r.message) {
                        frappe.show_alert({
                            message: __('Call List {0} created successfully', [r.message.name]),
                            indicator: 'green'
                        });
                        
                        dialog.hide();
                        
                        // Open the call list
                        frappe.set_route('Form', 'Genii Call List', r.message.name);
                    }
                },
                error: function(r) {
                    frappe.msgprint({
                        title: __('Error'),
                        message: __('Failed to create call list'),
                        indicator: 'red'
                    });
                }
            });
        }
    });
    
    dialog.show();
}

// Add custom list view actions
frappe.listview_settings['Lead'].get_row_actions = function(doc) {
    return [
        {
            label: __('Add to Call List'),
            action: function() {
                add_lead_to_call_list(doc.name);
            },
            icon: 'phone'
        }
    ];
};

// Function to add a single lead to today's call list
function add_lead_to_call_list(lead_name) {
    frappe.call({
        method: 'genii_call_list.genii_call_list_management.doctype.genii_call_list.genii_call_list.get_my_call_list',
        args: {
            date: frappe.datetime.now_date(),
            salesperson: frappe.session.user
        },
        callback: function(r) {
            if (r.message && r.message.success) {
                // Call list exists, add lead to it
                const call_list_name = r.message.data.name;
                
                frappe.call({
                    method: 'frappe.client.set_value',
                    args: {
                        doctype: 'Genii Call List',
                        name: call_list_name,
                        fieldname: 'leads',
                        value: [{
                            lead: lead_name,
                            status: 'New'
                        }],
                        child_doctype: 'Genii Call List Lead'
                    },
                    callback: function() {
                        frappe.show_alert({
                            message: __('Lead added to call list'),
                            indicator: 'green'
                        });
                    }
                });
            } else {
                // No call list for today, create one
                frappe.msgprint({
                    title: __('No Call List'),
                    message: __('Create a call list for today first'),
                    indicator: 'orange'
                });
            }
        }
    });
}
