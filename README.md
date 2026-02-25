# Genii Call List

A branded, mobile-first daily lead dashboard for salespeople in ERPNext. This custom Frappe app provides a streamlined interface for managing call lists, logging activities, and tracking lead engagement with Genii branding throughout.

## Features

### Core Functionality
- **Custom DocTypes**: Genii Call List (parent) and Genii Call List Lead (child table)
- **Mobile-First UI**: Responsive card-based interface optimized for phone use
- **Inline Updates**: Update lead status and notes without leaving the call list
- **Call Logging**: Integrated call activity tracking to CRM Communication
- **Smart Filtering**: Filter by status (New, Callback, Interested, etc.)
- **Lead Scoring**: Color-coded lead score badges (green 80+, yellow 50-79, red <50)
- **ADU Potential Tracking**: Custom field for ADU development opportunities
- **Tap-to-Call**: Phone numbers formatted as tel: links for instant dialing

### Branding
- **Primary Color**: #1A1A2E (dark navy)
- **Accent Color**: #E94560 (red/coral)
- **Background**: #F8F9FA (light gray)
- **Font**: Inter or system-sans

### API Endpoints (Whitelisted)
1. `get_my_call_list(date, salesperson)` - Retrieve today's leads for a salesperson
2. `update_lead_status(lead_name, status, notes)` - Inline status/notes update
3. `log_call_attempt(lead_name, outcome, notes)` - Log call to CRM Communication

### CRM Integration
- **Lead List Customization**: Additional columns (phone, property_address, lead_score, adu_potential)
- **Custom Filters**: "My Leads Today" and "High Priority" presets
- **Bulk Actions**: Create call lists from selected leads
- **Communication Logging**: Automatic CRM Communication records for all calls

### Automation
- **Daily Call List Generation**: Scheduled task creates call lists every morning
- **Auto-Population**: Pulls qualified leads for each salesperson automatically

## Installation

### Via Git (Recommended)

```bash
cd frappe-bench
bench get-app https://github.com/davidmschy/genii-call-list.git
bench --site erp.geniinow.com install-app genii_call_list
bench --site erp.geniinow.com migrate
bench --site erp.geniinow.com clear-cache
bench restart
```

### On Frappe Cloud

1. **Upload the App**
   ```bash
   cd genii_call_list
   tar -czf genii_call_list.tar.gz .
   ```

2. **Install via Frappe Cloud Dashboard**
   - Go to your site dashboard
   - Navigate to "Apps" > "Install Custom App"
   - Upload `genii_call_list.tar.gz`
   - Click "Install"

## Usage

### For Salespeople

1. **Access Your Call List**
   - Navigate to: `/app/my-call-list` or search "My Call List" in the search bar
   - Your daily leads appear as cards with all contact information

2. **Making Calls**
   - Tap phone numbers to dial directly (mobile devices)
   - Update status inline (New → Called → Interested → Converted)
   - Add notes by clicking the "💬 Notes" button

3. **Logging Activities**
   - Click "Log Call" on any lead card
   - Select outcome (Called/Interested/Not Interested/Callback)
   - Add notes and save
   - Activity is automatically logged to ERPNext CRM

4. **Filtering**
   - Use filter buttons: All / New / Callback / Interested
   - Change date to view past or future call lists

### For Sales Managers

1. **Creating Call Lists**
   - Go to CRM > Lead list
   - Select leads to assign
   - Click "Create Call List"
   - Choose salesperson and date

2. **Monitoring Performance**
   - View dashboard metrics: Total, Called, Interested counts
   - Track conversion rates per salesperson
   - Review communication logs in CRM

### For Administrators

1. **Configuration**
   - Set up scheduled task in hooks.py (already configured for daily 7 AM)
   - Customize lead scoring logic in genii_call_list.py
   - Adjust branding colors in genii_call_list.css

2. **Permissions**
   - Default roles: Sales User, Sales Manager
   - Modify in DocType permissions as needed

## File Structure

```
genii_call_list/
├── setup.py                          # App metadata and dependencies
├── requirements.txt                  # Python dependencies
└── genii_call_list/
    ├── __init__.py                   # Version info
    ├── hooks.py                      # Frappe hooks and configuration
    ├── config/
    │   ├── __init__.py
    │   └── desktop.py                # Desktop/workspace configuration
    ├── public/
    │   ├── js/
    │   │   └── lead_list.js          # Lead list view customization
    │   └── css/
    │       └── genii_call_list.css   # Branded styles
    └── genii_call_list_management/
        ├── __init__.py
        ├── doctype/
        │   ├── genii_call_list/
        │   │   ├── genii_call_list.json         # DocType definition
        │   │   ├── genii_call_list.py           # Controller with API methods
        │   │   ├── genii_call_list_dashboard.py # Dashboard config
        │   │   └── __init__.py
        │   └── genii_call_list_lead/
        │       ├── genii_call_list_lead.json    # Child table definition
        │       ├── genii_call_list_lead.py      # Child controller
        │       └── __init__.py
        └── page/
            └── my_call_list/
                ├── my_call_list.json            # Page definition
                ├── my_call_list.html            # Mobile-first UI
                ├── my_call_list.js              # Interactive logic
                └── __init__.py
```

## Support

For issues or feature requests:
- Email: david@geniinow.com
- Create an issue in the repository

## License

MIT License - See LICENSE file for details

## Version History

**v1.0.0** (2026-02-24)
- Initial release
- Core call list functionality
- Mobile-first UI
- CRM integration
- Automatic daily list generation
