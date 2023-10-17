import Konva from "konva";
import { createMachine, interpret } from "xstate";


const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 11;
let polyline // La polyline en cours de construction;

const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiAMwBGAOxEAHAE4+fZQBYATKsUBWXRoA0ITIi0A2IvcW7jqvosOLVp1QF8-azQsPEIiCAAnAEMAdwIoanpmWgA1Jn4hJBA0MUlpWQUEAFp9LSI1XWVPDUMaxXsfa1sEF30iar5DZS0td21VewCgjBwCYkjY+MTGVg5uDNkciSkZLMLSp1NDez53ZVMt+zUmxB2NIl8NZVrFHWUNDUHA7JHQ8ei4-ATaGbZOXmUmREuRWBUQqmUmmMpWUznsBz4+nsJwQqg2qi0LmUeiMai0piGLxCY3CHymTFgAGMosgwAssks8qtQIUvGVVO5dKoNPVFNoaijDLUiEjSlohfZei4NITgqMwhNPgkmPhxGAIvTgct8mtEIZ9KYiHpDOYropPNVVCjzY4TaUTPj9GiHIpZa8SYqpgAhKKUgDWsGQvrpgkWom1zPkiCRRAhzo0HLxj0UKOUBicXkq3nMnS0+gCz3wqAgcDDxMIYZBOpZiCKvXKnKqtWb9StNjs5Q0ukUSItDgabvLxFI5ErEbBCHMbQ8OZcKg8PVT9ja+p6AwciMMuwJzzlb1Jky+Y6ZE4xRC8aJ5Wm6fA0+mO7ZaHM03L0ZgMCa3-gLQA */
        id: "polyLine",
        initial: "idle",
        states: {
            idle: {
                on: {
                    MOUSECLICK: {
                        target: "drawing",
                        actions: ["createLine"]
                    }
                }
            },

            drawing: {
                on: {
                    "Event 1": "MOUSEMOVE",

                    "Event 4": "ENTER"
                },

                always: "ESCAPE"
            },
                on: {
                    MOUSEMOVE: {
                        target: "drawing",
                        actions: ["setLastPoint"],
                        internal: true
                    },

                    MOUSECLICK: [{
                        target: "drawing",
                        actions: ["addPoint"],
                        internal: true,
                        cond: "pasPlein"
                    }, {
                        target: "idle",
                        actions: ["saveLine"]
                    }],

                    Escape: {
                        target: "idle",
                        actions: ["abandon"]
                    },

                    Enter: {
                        target: "idle",
                        actions: ["saveLine"],
                        cond: "plusDeDeuxPoints"
                    },
                    Backspace: {
                        target: "drawing",
                        internal: true,
                        actions: ["removeLastPoint"],
                        cond: "plusDeDeuxPoints"
                    }
                }
            }
        },
    // Quelques actions et guardes que vous pouvez utiliser dans votre machine
    {
        actions: {
            // Créer une nouvelle polyline
            createLine: (context, event) => {
                const pos = stage.getPointerPosition();
                polyline = new Konva.Line({
                    points: [pos.x, pos.y, pos.x, pos.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                layer.add(polyline);
            },
            // Mettre à jour le dernier point (provisoire) de la polyline
            setLastPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;

                const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                polyline.points(newPoints.concat([pos.x, pos.y]));
                layer.batchDraw();
            },
            // Enregistrer la polyline
            saveLine: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                // Le dernier point(provisoire) ne fait pas partie de la polyline
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                layer.batchDraw();
            },
            // Ajouter un point à la polyline
            addPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
                polyline.points(newPoints); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
            // Abandonner le tracé de la polyline
            abandon: (context, event) => {
                polyline.remove();
            },
            // Supprimer le dernier point de la polyline
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
                const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
                polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
        },
        guards: {
            // On peut encore ajouter un point
            pasPlein: (context, event) => {
                return polyline.points().length < MAX_POINTS * 2;
            },
            // On peut enlever un point
            plusDeDeuxPoints: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return polyline.points().length > 4;
            },
        },
    }
);

// On démarre la machine
const polylineService = interpret(polylineMachine)
    .onTransition((state) => {
        console.log("Current state:", state.value);
    })
    .start();
// On envoie les événements à la machine
stage.on("click", () => {
    polylineService.send("MOUSECLICK");
});

stage.on("mousemove", () => {
    polylineService.send("MOUSEMOVE");
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    // Enverra "a", "b", "c", "Escape", "Backspace", "Enter"... à la machine
    polylineService.send(event.key);
});