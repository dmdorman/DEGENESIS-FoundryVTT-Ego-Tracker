import { DegenesisCombat } from "../../../systems/degenesis/module/combat-degenesis.js"

Hooks.on("init", function() {
    DGNS_Ego_Tracker.initialize()
});

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(DGNS_Ego_Tracker.ID);
});

Hooks.on("combatRound", function () {
    // DGNS_Ego_Tracker.log(true, "combatRound called! -------------------")
    
    const activeEncounter = game.combats.combats.find(e => e.active === true)

    // DGNS_Ego_Tracker.log(true, activeEncounter)


    // for (const [key, value] of Object.entries(activeEncounter.combatants.contents)) {
    //     DGNS_Ego_Tracker.log(key)
    // }

    activeEncounter.combatants.contents.forEach(function (item, index) {
        //DGNS_Ego_Tracker.log(true, item.name)
        // DGNS_Ego_Tracker.log(true, item.players)

        if (item.players.length !== 0) {
            // DGNS_Ego_Tracker.log(true, item.name)
            item.players.forEach(function(i, ind) {
                let egoTrackerForm = new DGNS_Ego_Tracker_Form(item, {})

                egoTrackerForm.render(true, {})
            })
        } else {
            let egoTrackerForm = new DGNS_Ego_Tracker_Form(item, {})
            egoTrackerForm.render(true, {})
        }
    });

});

Hooks.on("closeFormApplication", function () {
    // DGNS_Ego_Tracker.log(true, "CLOSE!")
    // DGNS_Ego_Tracker.log(true, this)
})

class DGNS_Ego_Tracker {
    static initialize() {
        //this.customRulerForm = new DGNS_Ego_Tracker_Form()
    }

    static ID = 'degenesis-ego-tracker';

    static FLAGS = {
        DGNSEGOTRACKER: 'degenesis-ego-tracker'
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
            width: 100,
            id: DGNS_Ego_Tracker.ID,
            template: DGNS_Ego_Tracker.TEMPLATES.DGNS_Ego_Tracker,
            title: "DGNS-EGO-TRACKER.title",
            closeOnSubmit: true, // do not close when submitted
            submitOnChange: true, // submit when any input changes
            resizable: false,
        }

        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

        return mergedOptions
    }

    getData(options) {
        const actor = this.object.token._actor

        const ego = actor.system.condition.ego

        const name = actor.name

        return {
            ego: ego,
            name: name,
            spend: 0
        }
    }

    async _updateObject(event, formData) {
        const actor = this.object.token._actor

        const ego = actor.system.condition.ego

        let spendEgo = formData.spend

        if (formData.spend > (ego.max - ego.value)) {
            spendEgo = ego.max - ego.value
        }

        if (spendEgo > 3) {
            spendEgo = 3
        }

        const newEgo = ego.value + spendEgo

        await actor.update({["system.state.spentEgo.value"] : newEgo})
        //await actor.update({["system.condition.ego.value"] : newEgo})

        //await actor.update({ "flags.degenesis.-=spentEgoActionModifier": spendEgo })

        DegenesisCombat.rollInitiativeFor(actor)

        this.render();
    }
}
