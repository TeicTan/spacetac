To-Do-list
==========

Menu/settings/saves
-------------------

* Allow to delete cloud saves
* Fix cloud save games with "Level 0 - 0 ships"

Map/story
---------

* Add initial character creation
* Fix quickly zooming in twice preventing to display some UI parts
* Enemy fleet size should start low and increase with system level
* Allow to change/buy ship model
* Add ship personality (with icons to identify ?), with reaction dialogs
* Add factions and reputation
* Add generated missions with rewards
* Allow to cancel secondary missions
* Forbid to end up with more than 5 ships in the fleet because of escorts
* Show missions' destination near systems/locations

Character sheet
---------------

* Disable interaction during battle (except for loot screen)
* Improve eye-catching for shop and loot section
* Highlight allowed destinations during drag-and-drop, with text hints
* When transferring to another ship, if the item can't be equipped (unmatched requirements), the transfer is cancelled instead of trying cargo
* Effective skill is sometimes not updated when upgrading base skill
* Tooltip to show the sources of attributes
* Forbid to modify escorted ship
* Add merged cargo display for the whole fleet

Battle
------

* Fix numerous effects being displayed on ships at the end, behind outcome dialog
* Add a voluntary retreat option
* Display effects description instead of attribute changes
* Display radius for area effects (both on action hover, and while action is active)
* Any displayed info should be based on a ship copy stored in ArenaShip, and in sync with current log index (not the game state ship)
* Add engine trail effect, and sound
* Fix targetting not resetting on current cursor location when using keyboard shortcuts
* Allow to skip animations, and allow no animation mode
* Find incentives to move from starting position (permanent drones ?)
* Add a "loot all" button, disable the loot button if there is no loot
* Do not focus on ship while targetting for area effects (dissociate hover and target)
* Repair drone has its activation effect sometimes displayed as permanent effect on ships in the radius
* Merge identical sticky effects
* Allow to undo last moves
* Add a battle log display

Ships models and equipments
---------------------------

* Add permanent effects and actions to ship models
* Add critical hit/miss
* Add damage over time effect (tricky to make intuitive)
* Move distance should increase with maneuvrability
* Chance to hit should increase with precision
* Add actions with cost dependent of distance (like current move actions)
* Add hull points to drones and make them take area damage

Artificial Intelligence
-----------------------

* Use a first batch of producers, and only if no "good" move has been fo go on with some infinite producers
* Evaluate buffs/debuffs
* Abandon fight if the AI judges there is no hope of victory
* Add combination of random small move and actual maneuver, as prer
* New duel page with producers/evaluators tweaking
* Work in a dedicated process (webworker)

Technical
---------

* Ensure that tweens and particle emitters get destroyed once animation is done (or view changes)

Common UI
---------

* Fix hover being stuck when the cursor exits the window, or the item moves or is hidden
* Add a standard confirm dialog
* Mobile: think UI layout so that fingers do not block the view (right and left handed)
* Mobile: display tooltips larger and on the side of screen where the finger is not
* Mobile: targetting in two times, using a draggable target indicator

Postponed
---------

* Tutorial
* Secondary story arcs
* Replays
* Multiplayer/co-op
* Formation or deployment phase
* New battle internal flow: any game state change should be done through revertable events
* Animated arena background, instead of big picture
* Hide enemy information (shield, hull, weapons), until they are in play, or until a "spy" effect is used
* Invocation/reinforcements (need to up the 10 ships limit)
* Dynamic music composition