frappe.pages['my-call-list'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'My Call List',
        single_column: true
    });
    
    // Initialize the call list app
    new GeniiCallListApp(page);
}

class GeniiCallListApp {
    constructor(page) {
        this.page = page;
        this.wrapper = $(this.page.body);
        this.current_filter = 'all';
        this.call_list_data = null;
        this.leads = [];
        
        this.setup();
        this.load_call_list();
    }
    
    setup() {
        // Set today's date as default
        const today = frappe.datetime.now_date();
        $('#call-list-date').val(today);
        
        // Bind event handlers
        this.bind_events();
    }
    
    bind_events() {
        const me = this;
        
        // Filter buttons
        $('.filter-buttons button').on('click', function() {
            $('.filter-buttons button').removeClass('active');
            $(this).addClass('active');
            me.current_filter = $(this).data('filter');
            me.render_leads();
        });
        
        // Date picker change
        $('#call-list-date').on('change', function() {
            me.load_call_list();
        });
    }
    
    load_call_list() {
        const me = this;
        const date = $('#call-list-date').val() || frappe.datetime.now_date();
        
        // Show loading state
        $('#loading-state').show();
        $('#leads-grid').hide();
        $('#empty-state').hide();
        
        frappe.call({
            method: 'genii_call_list.genii_call_list_management.doctype.genii_call_list.genii_call_list.get_my_call_list',
            args: {
                date: date,
                salesperson: frappe.session.user
            },
            callback: function(r) {
                $('#loading-state').hide();
                
                if (r.message && r.message.success) {
                    me.call_list_data = r.message.data;
                    me.leads = r.message.data.leads || [];
                    
                    if (me.leads.length === 0) {
                        $('#empty-state').show();
                    } else {
                        me.render_leads();
                        me.update_stats();
                    }
                } else {
                    $('#empty-state').show();
                    frappe.msgprint({
                        title: __('No Call List'),
                        message: r.message?.message || 'No call list found for this date',
                        indicator: 'orange'
                    });
                }
            },
            error: function() {
                $('#loading-state').hide();
                $('#empty-state').show();
            }
        });
    }
    
    render_leads() {
        const me = this;
        const grid = $('#leads-grid');
        grid.empty().show();
        
        // Filter leads based on current filter
        let filtered_leads = me.leads;
        if (me.current_filter !== 'all') {
            filtered_leads = me.leads.filter(lead => lead.status === me.current_filter);
        }
        
        if (filtered_leads.length === 0) {
            grid.html(`<div class="col-12 text-center text-muted py-5">
                <p>No leads match the selected filter</p>
            </div>`);
            return;
        }
        
        // Render each lead card
        filtered_leads.forEach(lead => {
            const card = me.create_lead_card(lead);
            grid.append(card);
        });
        
        // Bind card events
        me.bind_card_events();
    }
    
    create_lead_card(lead) {
        // Clone template
        const template = document.getElementById('lead-card-template');
        const card = $(template.content.cloneNode(true));
        
        // Set card data
        card.find('.lead-card-wrapper').attr('data-lead-name', lead.name);
        card.find('.lead-name').text(lead.lead_name || 'Unknown');
        
        // Lead score badge with color coding
        const score = lead.lead_score || 0;
        let badgeClass = 'badge-danger';
        if (score >= 80) badgeClass = 'badge-success';
        else if (score >= 50) badgeClass = 'badge-warning';
        
        card.find('.lead-score-badge')
            .addClass(`badge ${badgeClass}`)
            .text(`Score: ${score}`);
        
        // Phone numbers with tel: links
        if (lead.phone) {
            card.find('.phone-link')
                .attr('href', `tel:${lead.phone}`)
                .text(lead.phone);
        } else {
            card.find('.phone-link').parent().hide();
        }
        
        if (lead.mobile) {
            card.find('.mobile-row').show();
            card.find('.mobile-link')
                .attr('href', `tel:${lead.mobile}`)
                .text(lead.mobile);
        }
        
        // Property address
        if (lead.property_address) {
            card.find('.property-address').text(lead.property_address);
        } else {
            card.find('.property-row').hide();
        }
        
        // Location
        const location = [lead.city, lead.state].filter(Boolean).join(', ');
        if (location) {
            card.find('.location').text(location);
        } else {
            card.find('.location-row').hide();
        }
        
        // ADU potential badge
        if (lead.adu_potential) {
            card.find('.adu-badge').show();
        }
        
        // Deal stage
        if (lead.deal_stage) {
            card.find('.deal-stage-badge')
                .addClass('badge badge-info')
                .text(lead.deal_stage)
                .show();
        } else {
            card.find('.deal-stage-badge').hide();
        }
        
        // Status select
        card.find('.status-select').val(lead.status || 'New');
        
        // Notes
        if (lead.notes) {
            card.find('.notes-textarea').val(lead.notes);
        }
        
        return card;
    }
    
    bind_card_events() {
        const me = this;
        
        // Status change
        $('.status-select').on('change', function() {
            const card = $(this).closest('.lead-card-wrapper');
            const leadName = card.data('lead-name');
            const newStatus = $(this).val();
            
            me.update_lead_status(leadName, newStatus);
        });
        
        // Show notes section
        $('.save-notes-btn').on('click', function() {
            const card = $(this).closest('.genii-lead-card');
            card.find('.lead-notes-section').slideToggle();
        });
        
        // Save notes
        $('.save-notes-confirm').on('click', function() {
            const card = $(this).closest('.lead-card-wrapper');
            const leadName = card.data('lead-name');
            const notes = card.find('.notes-textarea').val();
            
            me.update_lead_status(leadName, null, notes);
            card.find('.lead-notes-section').slideUp();
        });
        
        // Cancel notes
        $('.cancel-notes').on('click', function() {
            const card = $(this).closest('.genii-lead-card');
            card.find('.lead-notes-section').slideUp();
        });
        
        // Log call button
        $('.log-call-btn').on('click', function() {
            const card = $(this).closest('.lead-card-wrapper');
            const leadName = card.data('lead-name');
            const lead = me.leads.find(l => l.name === leadName);
            
            me.show_log_call_dialog(lead);
        });
    }
    
    update_lead_status(lead_name, status, notes) {
        const me = this;
        
        frappe.call({
            method: 'genii_call_list.genii_call_list_management.doctype.genii_call_list.genii_call_list.update_lead_status',
            args: {
                lead_name: lead_name,
                status: status,
                notes: notes
            },
            callback: function(r) {
                if (r.message && r.message.success) {
                    frappe.show_alert({
                        message: __('Lead updated successfully'),
                        indicator: 'green'
                    });
                    
                    // Update local data
                    const lead = me.leads.find(l => l.name === lead_name);
                    if (lead) {
                        if (status) lead.status = status;
                        if (notes) lead.notes = notes;
                    }
                    
                    me.update_stats();
                } else {
                    frappe.msgprint({
                        title: __('Error'),
                        message: r.message?.message || 'Failed to update lead',
                        indicator: 'red'
                    });
                }
            }
        });
    }
    
    show_log_call_dialog(lead) {
        const me = this;
        
        const dialog = new frappe.ui.Dialog({
            title: `Log Call - ${lead.lead_name}`,
            fields: [
                {
                    fieldtype: 'Select',
                    label: 'Outcome',
                    fieldname: 'outcome',
                    options: ['Called', 'Interested', 'Not Interested', 'Callback'],
                    reqd: 1
                },
                {
                    fieldtype: 'Small Text',
                    label: 'Notes',
                    fieldname: 'notes'
                }
            ],
            primary_action_label: 'Log Call',
            primary_action: function(values) {
                frappe.call({
                    method: 'genii_call_list.genii_call_list_management.doctype.genii_call_list.genii_call_list.log_call_attempt',
                    args: {
                        lead_name: lead.lead,
                        outcome: values.outcome,
                        notes: values.notes
                    },
                    callback: function(r) {
                        if (r.message && r.message.success) {
                            frappe.show_alert({
                                message: __('Call logged successfully'),
                                indicator: 'green'
                            });
                            
                            // Update status in UI
                            me.update_lead_status(lead.name, values.outcome, values.notes);
                            dialog.hide();
                        } else {
                            frappe.msgprint({
                                title: __('Error'),
                                message: r.message?.message || 'Failed to log call',
                                indicator: 'red'
                            });
                        }
                    }
                });
            }
        });
        
        dialog.show();
    }
    
    update_stats() {
        const me = this;
        
        // Update header stats
        $('#salesperson-name').text(frappe.user.full_name());
        $('#total-leads').text(me.leads.length);
        
        const called = me.leads.filter(l => 
            ['Called', 'Interested', 'Not Interested', 'Callback', 'Converted'].includes(l.status)
        ).length;
        $('#called-count').text(called);
        
        const interested = me.leads.filter(l => l.status === 'Interested').length;
        $('#interested-count').text(interested);
    }
}
