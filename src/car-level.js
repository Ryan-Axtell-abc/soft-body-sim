import { Application, Ticker } from 'pixi.js';
import { Viewport } from 'pixi-viewport'

import { Constants, Elements, Globals } from './classes.js'
import { update_physics, create_fps_counter, draw_graphics, shake_screen, launch_ball, get_world_position, set_shape_position,  } from './functions.js'
import { general_accelerator, make_2x40_bridge, general_shape, general_rectangle_builder } from './shape_building.js';
import { make_platform_array, set_up_event_listeners, set_up_event_listeners_car_level, setup, spawn_car } from './setup_functions.js';

const constants = new Constants();
const globals = new Globals();
const elements = new Elements();

// Create a PixiJS application.
const app = new Application();
globals.app = app;


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
        .pinch()
        .wheel()
        .decelerate()
        .setZoom(0.5)


    elements.cloth_sim_holder.appendChild(app.canvas);
    set_up_event_listeners(globals, elements, constants, app);
    set_up_event_listeners_car_level(globals, elements, constants, app);

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


                    elements.controls_overlay.classList.remove("hidden");

                    const bridge_1 = make_2x40_bridge(globals);
                    globals.level_shapes.add(bridge_1);
                    set_shape_position(globals, bridge_1, true, {x: 10310, y: -2590});
                    bridge_1.group = "stage_accessory"
                    //bridge_1.color = 0x00ff00;
                    bridge_1.color = 0x4fff4f;
                    bridge_1.color = 0x01ffc5;
                    bridge_1.color = 0x9501ff;
                    //bridge_1.color = 0x9566ff;
                    bridge_1.color = 0x9526ff;
                    bridge_1.color = constants.stage_accessories_color;

                    const bridge_2 = general_rectangle_builder(globals, 100, 20, 2, true, 5, true);
                    globals.level_shapes.add(bridge_2);
                    set_shape_position(globals, bridge_2, true, {x: 15830, y: 2900});
                    bridge_2.group = "stage_accessory"
                    bridge_2.color = constants.stage_accessories_color;


                    const rising_platform = general_rectangle_builder(globals, 100, 20, 4, false);
                    rising_platform.frame_collection[0].fixed = true;
                    rising_platform.group = "stage_accessory"
                    rising_platform.color = constants.fixed_ground_color;
                    rising_platform.color = constants.stage_accessories_color;
                    rising_platform.is_raising = true;
                    rising_platform.max_raised_amount = -2700;
                    globals.level_shapes.add(rising_platform);
                    set_shape_position(globals, rising_platform, true, {x: 14418, y: -3125});
                    rising_platform.starting_center = rising_platform.calculate_center_of_certain_verts(rising_platform.surface_vertice_holder);
                    /*
                    */



                    make_platform_array(globals, constants, 6, {x:18370, y: -5750}, 200, 0)
                    
                    const acc_1_surface_point_list = [
                        {	x: 23.6175,	 y: 2.0951	},
                        {	x: 23.2589,	 y: 2.3495	},
                        {	x: 23.4539,	 y: 2.6243	},
                        {	x: 23.8125,	 y: 2.3699	},
                    ]
                    

                    const accelerator_1 = general_accelerator(globals, 1000, acc_1_surface_point_list);
                    accelerator_1.update_bounding_box();
                    accelerator_1.x_force = 2.5;
                    accelerator_1.y_force = -2.3;


                    const acc_2_surface_point_list = [
                        {	x: 37.6342,	 y: -2.1457	},
                        {	x: 32.9253,	 y: -3.3224	},
                        {	x: 32.7802,	 y: -2.7416	},
                        {	x: 37.489,	 y: -1.5649	},
                    ]
                    

                    const accelerator_2 = general_accelerator(globals, 1000, acc_2_surface_point_list);
                    accelerator_2.update_bounding_box();
                    accelerator_2.x_force = -2.75*1;
                    accelerator_2.y_force = -.9*1;

                    const level_accessories_shape_data_files = import.meta.glob('/assets/shapes/level/accessories/*.json', { eager: true });
                    let button_count = 0
                    for (let file_package of Object.entries(level_accessories_shape_data_files)) {
                        const name = file_package[0].split('/').pop().split(".")[0];
                        const file = file_package[1];
                        console.log("name", name)
                        const frame_index_lists_collection = [];
                        for (let i = 0; i < file.surface_points.length; i++) {
                            frame_index_lists_collection.push(i);
                        }
                        const shape = general_shape(globals, 1000, file.inner_points, file.surface_points, file.springs, [frame_index_lists_collection], [true], .2)
                        shape.group = "stage"
                        shape.color = constants.fixed_ground_color;
                        globals.level_shapes.add(shape);

                        if (name == "mud") {
                            shape.FRAME_DAMPING = .15;
                            shape.color = constants.mud_color;
                        }
                        if (name.split("_")[0] == "button") {
                            shape.color = constants.button_unpressed_color;
                            shape.type = "button"
                            button_count += 1;
                            shape.button_index = button_count;
                            globals.unpressed_buttons.add(button_count);
                        }
                    }
                    console.log("globals.unpressed_buttons:", globals.unpressed_buttons);

                    const level_shape_data_files = import.meta.glob('/assets/shapes/level/*.json', { eager: true });
                    for (let file of Object.values(level_shape_data_files)) {
                        const frame_index_lists_collection = [];
                        for (let i = 0; i < file.surface_points.length; i++) {
                            frame_index_lists_collection.push(i);
                        }
                        const shape = general_shape(globals, 1000, file.inner_points, file.surface_points, file.springs, [frame_index_lists_collection], [true], .2)
                        shape.group = "stage"
                        shape.color = constants.fixed_ground_color;
                        globals.level_shapes.add(shape);
                    }
                    
                    
                    //bridge.DAMPING = .25;

                    spawn_car(globals, constants, viewport);

                    globals.start_time = Date.now()
                    running_setup = false
				}
        } else {

            if (globals.paused == false) {

                if (globals.queued_fire) {
                    launch_ball(globals)
                }                
 
                if (globals.physics_independent_from_frame_rate) {
                    const target_frame_time = 1.0; // Since PIXI seems to target deltaTime of 1.0
                    let rounded_delta_time = time.deltaTime;
                    /*
                    if (rounded_delta_time > target_frame_time - .5 && rounded_delta_time < target_frame_time + .5) {
                        rounded_delta_time = target_frame_time;
                    }
                    */
                   let counter = 0
                    accumulator += rounded_delta_time / 60;
                    while (accumulator >= constants.FIXED_TIME_STEP) {
                        //update_physics(globals, constants, constants.FIXED_TIME_STEP);

                        for (let i = 0; i < globals.physics_updates_per_tick; i++) {
                            update_physics(globals, constants, constants.FIXED_TIME_STEP);
                        }
                        accumulator -= constants.FIXED_TIME_STEP;
                        counter += 1;
                    }
                    //console.log("counter:", counter, time.deltaTime)
                } else {
                    for (let i = 0; i < globals.physics_updates_per_tick; i++) {
                        update_physics(globals, constants, constants.FIXED_TIME_STEP);

                    }
                }

                if ( Date.now() < globals.shake_until ) {
                    shake_screen( globals, viewport );
                }

                /*
                for (let i = 0; i < 1000; i++) {
                    console.log("1")
                    console.log("2")

                }
                    */


                const world_pos = get_world_position(viewport, globals.mouse_screen_position.x, globals.mouse_screen_position.y);
                globals.mouse_world_position = world_pos;

            }
            draw_graphics(globals);
        }
    });
})();


