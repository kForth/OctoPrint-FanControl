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
        self.on_command = ko.observable([]);
        self.off_command = ko.observable([]);
        self.fans = ko.observableArray([]);

        // Settings
        self.saveSettings = function () {
            OctoPrint.settings.save({
                plugins: {
                    fancontrol: {
                        on_command: self.on_command(),
                        off_command: self.off_command(),
                        fans: ko.mapping.toJS(self.fans)
                    }
                }
            });
        };

        self.readSettings = function () {
            let settings = self.settingsView.settings.plugins.fancontrol;
            self.on_command(settings.on_command());
            self.off_command(settings.off_command());
            self.fans(settings.fans());
        };

        // Fan List
        self.addFan = function () {
            self.fans.push(
                ko.mapping.fromJS({
                    id: "",
                    name: self._getNewFanName("Fan"),
                    min: 0,
                    max: 255,
                    step: 1,
                    speed: 255
                })
            );
        };

        self.duplicateFan = function () {
            self.fans.push(
                ko.mapping.fromJS({
                    id: this.id(),
                    name: self._getNewFanName(this.name()),
                    min: this.min(),
                    max: this.max(),
                    step: this.step(),
                    speed: this.speed()
                })
            );
        };

        self.removeFan = function (index) {
            let fans = self.fans();
            _.pullAt(fans, index);
            self.fans(fans);
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
            let match = /^(.*)\s+\((\d+)\)$/.exec(base);
            if (match) {
                base = match[1];
                i = parseInt(match[2]);
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
            OctoPrint.control.sendGcodeWithParameters(self.on_command(), {
                id: this.id(),
                speed: Math.min(Math.max(this.speed(), this.min()), this.max())
            });
        };

        self.setFanOff = function () {
            OctoPrint.control.sendGcodeWithParameters(self.off_command(), {
                id: this.id()
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
