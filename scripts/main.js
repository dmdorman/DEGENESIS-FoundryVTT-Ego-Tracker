import { DegenesisCombat } from "../../../systems/degenesis/module/combat-degenesis.js"

Hooks.on("init", function() {
    //EgoTracker.initialize()
});

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(EgoTracker.ID);
});

Hooks.once("ready", () => {
    EgoTracker.initialize()

    game.socket.on(EgoTracker.SOCKET, ( options ) => {
        EgoTracker.log(true, "-----------------")
        EgoTracker.log(true, options.type)

        switch(options.type) {
            case 'open':
                
                const userId = game.userId;
        
                EgoTracker.egoTrackerForm.render(true, {userId})

                break;
            default:
                break;
        }

    //   switch(options.type) {
    //     case 'show':
    //       Hooks.call('showHourglass', options.options);
    //       break;
    //     case 'increment':
    //       Hooks.call('incrementHourglass', options.options); 
    //       break;
    //     case 'pause':
    //       Hooks.call('pauseHourglass', options.options); 
    //       break;
    //   }
    });
  });

Hooks.on("combatRound", function () {
    // EgoTracker.log(true, "combatRound called! -------------------")
    
    const userId = game.userId;
    
    EgoTracker.egoTrackerForm.render(true, {userId})

    game.socket.emit(EgoTracker.SOCKET, { type:'open', options: {} });

    // EgoTracker.log(true, activeEncounter)


    // for (const [key, value] of Object.entries(activeEncounter.combatants.contents)) {
    //     EgoTracker.log(key)
    // }



    // activeEncounter.combatants.contents.forEach(function (item, index) {
    //     //EgoTracker.log(true, item.name)
    //     // EgoTracker.log(true, item.players)

    //     if (item.players.length !== 0) {
    //         // EgoTracker.log(true, item.name)
    //         item.players.forEach(function(i, ind) {
    //             let egoTrackerForm = new EgoTrackerForm(item, {})

    //             egoTrackerForm.render(true, {})
    //         })
    //     } else {
    //         let egoTrackerForm = new EgoTrackerForm(item, {})
    //         egoTrackerForm.render(true, {})
    //     }
    // });

    

});

Hooks.on("closeFormApplication", function () {
    // EgoTracker.log(true, "CLOSE!")
    // EgoTracker.log(true, this)
})

class EgoTracker {
    static initialize() {
        this.egoTrackerForm = new EgoTrackerForm()
    }

    static ID = 'degenesis-ego-tracker';

    static SOCKET = 'module.' + this.ID

    static FLAGS = {
        DGNSEGOTRACKER: 'degenesis-ego-tracker'
    }

    static TEMPLATES = {
        EgoTracker: `./modules/${this.ID}/templates/dgns-ego-tracker.hbs`
    }

    static SETTINGS = {}

    static log(force, ...args) {
        const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(this.ID);

        if (shouldLog) {
            console.log(this.ID, '|', ...args);
        }
    }
}

class EgoTrackerForm extends FormApplication {
    static initialize() {
        this.egoTracker = new EgoTrackerForm()
    }

    static get defaultOptions() {
        const defaults = super.defaultOptions;

        const overrides = {
            height: 'auto',
            width: 100,
            id: EgoTracker.ID,
            template: EgoTracker.TEMPLATES.EgoTracker,
            title: "DGNS-EGO-TRACKER.title",
            userId: game.userId,
            closeOnSubmit: true, // do not close when submitted
            submitOnChange: true, // submit when any input changes
            resizable: false,
        }

        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

        return mergedOptions
    }

    getData(options) {
        const tokens = EgoTrackerData.getTokensForUser(game.userId)

        return {
            tokens: tokens
        }

        // const actor = this.object.token._actor

        // const ego = actor.system.condition.ego

        // const name = actor.name

        // return {
        //     ego: ego,
        //     name: name,
        //     spend: 0
        // }
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

class EgoTrackerData {
    static getActiveEncounter() {
        return game.combats.combats.find(e => e.active === true)
    }

    static getTokensForUser(userId) {
        const encounter = this.getActiveEncounter()

        const tokens = encounter.combatants.contents.reduce((accumulator, token) => {
            const player = game.users.get(userId)
            
            if (player.isGM && token.players.length === 0) {
                // npc
                EgoTracker.log(true, "NPC")
                return {
                    ...accumulator,
                    ...token,
                }
            } else if (token.players.includes(player)) {
                return {
                    ...accumulator,
                    ...token,
                }
            } else {
                return {
                    ...accumulator
                }
            }  
        })

        return tokens
    }
}
