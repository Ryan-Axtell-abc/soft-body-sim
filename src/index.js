import { Application, Ticker } from 'pixi.js';
import { Viewport } from 'pixi-viewport'

import { Constants, Elements, Globals } from './classes.js'
import { update_physics, create_fps_counter, draw_graphics, shake_screen, launch_ball, get_world_position, set_shape_position,  } from './functions.js'
import {  } from './shape_building.js';
import { set_up_event_listeners, setup, spawn_car } from './setup_functions.js';

const constants = new Constants();
const globals = new Globals();
const elements = new Elements();

// Create a PixiJS application.
const app = new Application();
globals.app = app;

globals.closed_room = true;

let accumulator = 0;

// Asynchronous IIFE
(async () =>
{
    // Intialize the application.
    await app.init({
        backgroundAlpha: 0,
        resizeTo: window,
        antialias: true,
    });

    // create viewport
    const viewport = new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        worldWidth: 1000,
        worldHeight: 1000,

        events: app.renderer.events // the interaction module is important for wheel to work properly when renderer.canvas is placed or scaled
    })

    globals.viewport = viewport;

    // add the viewport to the stage
    app.stage.addChild(viewport)

    viewport
        //.pinch()
        //.wheel()
        //.decelerate()
        //.setZoom(0.5)


    elements.cloth_sim_holder.appendChild(app.canvas);
    set_up_event_listeners(globals, elements, constants, app);

    setup(globals, app);
    create_fps_counter();
    var running_setup = true;

    //Ticker.shared.maxFPS = 60;
    //Ticker.shared.targetFPMS = 0.06;
    //Ticker.shared.targetFPMS = 0.0024;
    //settings.TARGET_FPMS
    //Ticker.shared.maxFPS = 10;

    app.ticker.maxFPS = 60;
    app.ticker.minFPS = 60;

    app.ticker.add((time) =>
    {
        if (running_setup) {
				if ( document.getElementById("fps-counter-element") != undefined && document.getElementById("fps-counter-element") != null) {
                    elements.fps_counter = document.getElementById("fps-counter-element");

                    if (elements.show_fps_checkbox.checked == false) {
                        elements.fps_counter.classList.add('hidden');
                        elements.level_button_holder.classList.remove('level-button-holder-offset');
                    }

                    globals.start_time = Date.now()
                    running_setup = false
				}
        } else {

            if (globals.paused == false) {             
 
                if (globals.physics_independent_from_frame_rate) {
                    const target_frame_time = 1.0; // Since PIXI seems to target deltaTime of 1.0
                    let rounded_delta_time = time.deltaTime;
                    if (rounded_delta_time > target_frame_time - .5 && rounded_delta_time < target_frame_time + .5) {
                        rounded_delta_time = target_frame_time;
                    }
                    accumulator += rounded_delta_time / 60;
                    while (accumulator >= constants.FIXED_TIME_STEP) {
                        update_physics(globals, constants, constants.FIXED_TIME_STEP);
                        accumulator -= constants.FIXED_TIME_STEP;
                    }
                } else {
                    for (let i = 0; i < globals.physics_updates_per_tick; i++) {
                        update_physics(globals, constants, constants.FIXED_TIME_STEP);

                    }
                }

                const world_pos = get_world_position(viewport, globals.mouse_screen_position.x, globals.mouse_screen_position.y);
                globals.mouse_world_position = world_pos;

            }
            draw_graphics(globals);
        }
    });
})();


