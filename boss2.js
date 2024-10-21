var BossBattleScript = {
    attackLimit: 5,  // Number of times to attack the boss
    attacksMade: 0,  // Counter to track the number of attacks
    CurrentBoss: null,
    TokensLeft: 0,
    isBusy: false,
    
    init: function () {
        var t = BossBattleScript;
        console.log("Initializing Boss Battle Script...");

        // Check if a boss event is active
        t.checkEvent(function () {
            console.log("Event Found! Starting battle...");
            t.startBattle();
        });
    },

    checkEvent: function (callback) {
        var t = BossBattleScript;
        t.CurrentBoss = uW.cm.BossModel.getEvent();  // Retrieve the current boss event

        if (!t.CurrentBoss || !t.CurrentBoss.eventId) {
            console.log("No active boss event found. Retrying in 1 second...");
            setTimeout(function () { t.checkEvent(callback); }, 1000);  // Retry after 1 second
            return;
        }
        
        console.log("Active boss event found: ", t.CurrentBoss);
        callback();  // Proceed to start the battle
    },

    startBattle: function () {
        var t = BossBattleScript;

        if (t.isBusy) return;
        
        if (t.CurrentBoss && t.TokensLeft >= t.CurrentBoss.cost) {
            t.isBusy = true;

            // Start the battle and set up the loop to attack 5 times
            console.log("Starting Boss Battle...");
            t.performAttacks();
        } else {
            console.log("Not enough tokens or no valid boss event.");
        }
    },

    performAttacks: function () {
        var t = BossBattleScript;

        // Attack the boss up to 5 times
        if (t.attacksMade < t.attackLimit && t.TokensLeft >= t.CurrentBoss.cost) {
            t.attackBoss(function () {
                t.attacksMade++;

                if (t.attacksMade < t.attackLimit) {
                    console.log("Attacking boss... Attack number:", t.attacksMade);
                    setTimeout(t.performAttacks, 1000);  // Wait 1 second between attacks
                } else {
                    console.log("Attacked boss 5 times. Stopping.");
                    t.isBusy = false;
                }
            });
        } else {
            console.log("Not enough tokens or reached attack limit. Stopping.");
            t.isBusy = false;
        }
    },

    attackBoss: function (callback) {
        var t = BossBattleScript;

        // Prepare the parameters for the attack
        var params = uW.Object.clone(uW.g_ajaxparams);
        params.eventId = t.CurrentBoss.eventId;
        params.userId = uW.tvuid;
        params.tokenCost = t.CurrentBoss.cost;
        
        // Send an AJAX request to attack the boss
        new MyAjaxRequest(uW.g_ajaxpath + "ajax/championBossFight.php" + uW.g_ajaxsuffix, {
            method: "post",
            parameters: params,
            onSuccess: function (rslt) {
                if (rslt.ok) {
                    t.TokensLeft -= t.CurrentBoss.cost;  // Deduct tokens

                    if (parseIntNan(rslt.health) > 0) {
                        console.log("Boss remaining health: ", rslt.health + "%");
                    } else {
                        console.log("Victory! Boss defeated.");
                    }

                    if (callback) callback();  // Continue to the next attack
                } else {
                    console.log("Error attacking boss:", rslt.debug);
                    t.isBusy = false;
                }
            },
            onFailure: function () {
                console.log("Server error during boss attack.");
                t.isBusy = false;
            }
        }, true);
    }
};

// Initialize the script
BossBattleScript.init();
