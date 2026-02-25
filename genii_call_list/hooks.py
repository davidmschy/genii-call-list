from . import __version__ as app_version

app_name = "genii_call_list"
app_title = "Genii Call List"
app_publisher = "Genii"
app_description = "A branded, mobile-first daily lead dashboard for salespeople in ERPNext"
app_icon = "octicon octicon-file-directory"
app_color = "#1A1A2E"
app_email = "david@geniinow.com"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "/assets/genii_call_list/css/genii_call_list.css"
app_include_js = "/assets/genii_call_list/js/lead_list.js"

# include js, css files in header of web template
# web_include_css = "/assets/genii_call_list/css/genii_call_list.css"
# web_include_js = "/assets/genii_call_list/js/genii_call_list.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "genii_call_list/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {"Lead" : "public/js/lead_list.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# generators = []

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "genii_call_list.utils.jinja_methods",
# 	"filters": "genii_call_list.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "genii_call_list.install.before_install"
# after_install = "genii_call_list.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "genii_call_list.uninstall.before_uninstall"
# after_uninstall = "genii_call_list.uninstall.after_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "genii_call_list.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}
# }

# Scheduled Tasks
# ---------------

scheduler_events = {
	"cron": {
		"0 7 * * *": [
			"genii_call_list.genii_call_list_management.doctype.genii_call_list.genii_call_list.auto_create_daily_call_lists"
		]
	}
}

# Testing
# -------

# before_tests = "genii_call_list.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "genii_call_list.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "genii_call_list.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]


# User Data Protection
# --------------------

user_data_fields = [
	{
		"doctype": "{doctype_1}",
		"filter_by": "{filter_by}",
		"redact_fields": ["{field_1}", "{field_2}"],
		"partial": 1,
	},
	{
		"doctype": "{doctype_2}",
		"filter_by": "{filter_by}",
		"partial": 1,
	},
	{
		"doctype": "{doctype_3}",
		"strict": False,
	},
	{
		"doctype": "{doctype_4}"
	}
]

# Authentication and authorization
# --------------------

# auth_hooks = [
# 	"genii_call_list.auth.validate"
# ]
