import octoprint.plugin


class FanControlPlugin(
    octoprint.plugin.SettingsPlugin,
    octoprint.plugin.AssetPlugin,
    octoprint.plugin.TemplatePlugin,
    octoprint.plugin.StartupPlugin,
):
    def __init__(self):
        super().__init__()

    ##~~ SettingsPlugin mixin

    def get_settings_defaults(self):
        return {
            "fans": [
                {
                    "index": 0,
                    "name": "Cooling Fan",
                    "speed": 255,
                },
            ],
        }

    ##~~ AssetPlugin mixin

    def get_assets(self):
        return {
            "js": ["js/fancontrol.js"],
            "css": ["css/fancontrol.css"],
            "less": ["less/fancontrol.less"],
        }

    ##~~ TemplatePlugin mixin

    def get_template_configs(self):
        return [
            {
                "type": "settings",
                "name": "Fan Control",
                "template": "fancontrol_settings.jinja2",
                "custom_bindings": True,
            },
            {
                "type": "sidebar",
                "name": "Fan Control",
                "template": "fancontrol_sidebar.jinja2",
                "custom_bindings": True,
                "icon": "fas fa-fan",
            },
        ]

    ##~~ Softwareupdate hook

    def get_update_information(self):
        return {
            "fancontrol": {
                "displayName": "Fan Control",
                "displayVersion": self._plugin_version,
                # version check: github repository
                "type": "github_release",
                "user": "kforth",
                "repo": "OctoPrint-FanControl",
                "current": self._plugin_version,
                # update method: pip
                "pip": "https://github.com/kforth/OctoPrint-FanControl/archive/{target_version}.zip",
            }
        }


__plugin_name__ = "Fan Control"

__plugin_pythoncompat__ = ">=3,<4"  # Only Python 3


def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = FanControlPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information,
    }
