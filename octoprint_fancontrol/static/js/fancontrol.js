/*
 * View model for OctoPrint-FanControl
 *
 * Author: Kestin Goforth
 * License: AGPLv3
 */
$(function () {
    function FanControlViewModel(parameters) {
        var self = this;

        // Injection Parameters
        self.settingsView = parameters[0];

        // Observables
        self.fans = ko.observableArray([]);

        self.saveSettings = function () {
            OctoPrint.settings.save({
                plugins: {
                    fancontrol: {
                        fans: ko.mapping.toJS(self.fans)
                    }
                }
            });
        };

        self.readSettings = function () {
            let settings = self.settingsView.settings.plugins.fancontrol;
            self.fans(settings.fans());
        };

        // Fan List
        self.addFan = function () {
            let fan = ko.mapping.fromJS({
                name: self._getNewFanName(),
                index: self.fans().length,
                speed: 255
            });
            self.fans.push(ko.mapping.fromJS(fan));
        };

        self.removeFan = function () {
            console.log(this);
        };

        self.canMoveUp = function (index) {
            return index > 0;
        };

        self.canMoveDown = function (index) {
            return index < self.fans().length - 1;
        };

        self.moveFanUp = function (index) {
            if (self.canMoveUp(index)) self._moveFan(index, -1);
        };

        self.moveFanDown = function (index) {
            if (self.canMoveDown(index)) self._moveFan(index, 1);
        };

        self._moveFan = function (index, distance) {
            let fan = self.fans()[index];
            self.fans.splice(index, 1);
            self.fans.splice(index + distance, 0, fan);
        };

        self._getNewFanName = function (base) {
            let i = 0;
            if (base) {
                let match = /^(.*)\s+\((\d+)\)$/.exec(base);
                if (match) {
                    base = match[1];
                    i = parseInt(match[2]);
                }
            } else {
                base = gettext("Fan");
            }
            const names = _.map(self.fans(), function (s) {
                return s.name();
            });
            let name = base;
            while (_.includes(names, name)) {
                name = _.sprintf("%(base)s (%(i)d)", {base, i: ++i});
            }
            return name;
        };

        // Fan Control

        self.setFanSpeed = function () {
            self.saveSettings();
            OctoPrint.control.sendGcodeWithParameters("M106 P%(index)d S%(speed)d", {
                index: _.parseInt(this.index()),
                speed: _.parseInt(this.speed())
            });
        };

        self.setFanOff = function () {
            OctoPrint.control.sendGcodeWithParameters("M107 P%(index)d", {
                index: _.parseInt(this.index())
            });
        };

        // Events

        self.onBeforeBinding = function () {
            self.readSettings();
        };

        self.onSettingsShown = function () {
            self.readSettings();
        };

        self.onDataUpdaterPluginMessage = function (plugin, data) {
            if (plugin !== "fancontrol") return;
            if (data && data.settings && data.settings.fans)
                self.fans(ko.mapping.fromJS(data.settings.fans)());
        };
    }

    OCTOPRINT_VIEWMODELS.push({
        construct: FanControlViewModel,
        dependencies: ["settingsViewModel"],
        elements: [
            "#settings_plugin_fancontrol",
            "#sidebar_plugin_fancontrol",
            "#tab_plugin_fancontrol"
        ]
    });
});
