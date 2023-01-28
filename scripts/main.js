Hooks.on("init", function() {
    DGNS_Ego_Tracker.initialize()
});

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(DGNS_Ego_Tracker.ID);
});

Hooks.on("combatRound", function () {
    DGNS_Ego_Tracker.log(true, "combatRound called! -------------------")
    
    const activeEncounter = game.combats.combats.find(e => e.active === true)

    DGNS_Ego_Tracker.log(true, activeEncounter)


    // for (const [key, value] of Object.entries(activeEncounter.combatants.contents)) {
    //     DGNS_Ego_Tracker.log(key)
    // }

    activeEncounter.combatants.contents.forEach(function (item, index) {
        DGNS_Ego_Tracker.log(true, item.name)
        DGNS_Ego_Tracker.log(true, item.players)

        let egoTrackerForm = new DGNS_Ego_Tracker_Form()
        let userId = game.userId
        egoTrackerForm.render(true, {userId})
    });

});

class DGNS_Ego_Tracker {
    static initialize() {
        //this.customRulerForm = new DGNS_Ego_Tracker_Form()
    }

    static ID = 'dgns-ego-tracker';

    static FLAGS = {
        CUSTOMRULER: 'dgns-ego-tracker'
    }

    static TEMPLATES = {
        DGNS_Ego_Tracker: `./modules/${this.ID}/templates/dgns-ego-tracker.hbs`
    }

    static SETTINGS = {}

    static log(force, ...args) {
        const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID);

        if (shouldLog) {
            console.log(this.ID, '|', ...args);
        }
    }
}

class DGNS_Ego_Tracker_Form extends FormApplication {
    static get defaultOptions() {
        const defaults = super.defaultOptions;

        const overrides = {
            height: 'auto',
            width: 600,
            id: DGNS_Ego_Tracker.ID,
            template: DGNS_Ego_Tracker.TEMPLATES.DGNS_Ego_Tracker,
            title: "DGNS-EGO-TRACKER.title",
            userId: game.userId,
            closeOnSubmit: false, // do not close when submitted
            submitOnChange: true, // submit when any input changes
            resizable: true,
        }

        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

        return mergedOptions
    }

    // getData(options) {
    //     return {
    //         isGM : game.users.get(options.userId)?.isGM,
    //         customRulers: DGNS_Ego_TrackerData.getDGNS_Ego_TrackersForUser(options.userId),
    //     }
    // }

    // async _updateObject(event, formData) {
    //     const expandedData = foundry.utils.expandObject(formData);

    //     await DGNS_Ego_TrackerData.updateUserDGNS_Ego_Tracker(this.options.userId, expandedData);

    //     this.render();
    // }
}