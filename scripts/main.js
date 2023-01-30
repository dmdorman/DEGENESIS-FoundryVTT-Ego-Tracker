import { DegenesisCombat } from "../../../systems/degenesis/module/combat-degenesis.js"

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(EgoTracker.ID);
});

Hooks.once("ready", () => {
    EgoTracker.initialize()

    game.socket.on(EgoTracker.SOCKET, ( options ) => {
        switch(options.type) {
            case 'open':
                const userId = game.userId;
                EgoTracker.egoTrackerForm.render(true, {userId})

                break;
            default:
                break;
        }
    });
  });

Hooks.on("combatRound", function () {
    const encounter = EgoTrackerData.getActiveEncounter()
    console.log(encounter.combatants)
    
    EgoTracker.openForm()
});

Hooks.on("combatStart", function () {    
    EgoTracker.openForm()
});

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

    static openForm() {
        const userId = game.userId;
        EgoTracker.egoTrackerForm.render(true, {userId})
    
        game.socket.emit(EgoTracker.SOCKET, { type:'open', options: {} });
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
            width: 250,
            id: EgoTracker.ID,
            template: EgoTracker.TEMPLATES.EgoTracker,
            title: "DGNS-EGO-TRACKER.title",
            userId: game.userId,
            closeOnSubmit: false, // do not close when submitted
            submitOnChange: true, // submit when any input changes
            resizable: false,
        }

        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

        return mergedOptions
    }

    getData(options) {
        const tokens = EgoTrackerData.getTokenActorsForUser(game.userId)

        return {
            data: tokens
        }
    }

    async _updateObject(event, formData) { 
        // do nothing
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".diamond").click(this._onEgoTrackerDiamond.bind(this))
        html.find(".ego-tracker-initiative-roll").click(this._onRollAllInitiatives.bind(this))
    }

    async _onEgoTrackerDiamond(event) {
        const target = $(event.currentTarget).parents(".ego-tracker-diamond-row").attr("data-target")

        const index = Number($(event.currentTarget).attr("data-index"));

        let spentEgo = index + 1
        
        const encounter = EgoTrackerData.getActiveEncounter()
        const actor = encounter.combatants.get(target).actor

        if (actor.system.state.spentEgo.value === spentEgo) {
            spentEgo = spentEgo - 1
        }

        await actor.update({["system.state.spentEgo.value"] : spentEgo})

        this.render()
    }

    async _onRollAllInitiatives(event) {
        const userId = game.userId

        const tokenActors = EgoTrackerData.getTokenActorsForUser(userId)

        const encounter = EgoTrackerData.getActiveEncounter()

        const player = game.users.get(userId)

        const combatants = EgoTrackerData.getCombatantsForPlayer(player)

        const ids = combatants.map(function (value, index) {
            return value._id
        })

        combatants.forEach(function(combatant, index) {
            EgoTrackerData.rollInitiativeFor(combatant)
        })

        this.close()
    }
}

class EgoTrackerData {
    static getActiveEncounter() {
        return game.combats.combats.find(e => e.active === true)
    }

    static getCombatantsForPlayer(player) {
        const encounter = this.getActiveEncounter()

        const combatants = (player.isGM) ? 
        encounter.combatants.contents.filter(e => e.players.length === 0)
        : encounter.combatants.contents.filter(e => e.players.includes(player))

        return combatants
    }

    static getTokenActorsForUser(userId) {
        const player = game.users.get(userId)

        const spentEgoBase = {
            0: {filled: false},
            1: {filled: false},
            2: {filled: false}
        }

        const tokens = this.getCombatantsForPlayer(player)

        const actors = tokens.map(e => game.actors.get(e.actorId))

        const fullTokenInfo = tokens.map(function (value, index) {
            let spentEgo = {
                0: {filled: false, disabled: false},
                1: {filled: false, disabled: false},
                2: {filled: false, disabled: false}
            }

            //const egoValue = actors[index].system.state.spentEgo.value
            const egoRemaining = tokens[index].actor.system.condition.ego.max - tokens[index].actor.system.condition.ego.value

            console.log("666666666666666")
            console.log(egoRemaining)

            const egoValue = tokens[index].actor.system.state.spentEgo.value
            for (const [key, value] of Object.entries(spentEgoBase)) {
                if (egoValue >= (Number(key) + 1)) {
                    spentEgo[`${key}`].filled = true
                } else {
                    spentEgo[key].filled = false
                }

                if (egoRemaining < (Number(key) + 1)) {
                    spentEgo[`${key}`].disabled = true
                } else {
                    spentEgo[`${key}`].disabled = false
                }
            }

            return {"token": value, "actor": actors[index], "spentEgo": spentEgo}
        });

        return fullTokenInfo
    }

    static async rollInitiativeFor(combatant) {
        game.combat.rollInitiative(combatant._id)

        //await combatant.actor.update({["system.state.spentEgo.value"] : 0})
    }
}
