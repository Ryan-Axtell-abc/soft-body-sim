import { Container, Graphics, Point, Sprite } from "pixi.js";
import { make_circle_1, make_circle_2, make_quad, make_car_body, general_rectangle_builder } from "./shape_building.js";
import { clear_shapes, create_circle_texture, get_world_position, hide_element, point_in_polygon, set_shape_position, show_element } from "./functions.js";


export function setup(globals, app) {
        
    if (globals.all_lines_graphics != undefined) {
        globals.all_lines_graphics.destroy();
    }
    if (globals.particle_container != undefined) {
        globals.particle_container.destroy();
    }
    if (globals.bounding_box_graphics != undefined) {
        globals.bounding_box_graphics.destroy();
    }

    if (globals.debug_graphics_layer_1 != undefined) {
        globals.debug_graphics_layer_1.destroy();
    }

    if (globals.debug_graphics_layer_2 != undefined) {
        globals.debug_graphics_layer_2.destroy();
    }

    if (globals.debug_graphics_layer_3 != undefined) {
        globals.debug_graphics_layer_3.destroy();
    }
    
    if (globals.overlay_graphics != undefined) {
        globals.overlay_graphics.destroy();
    }

    globals.all_lines_graphics = new Graphics();
    globals.bounding_box_graphics = new Graphics();
    globals.debug_graphics_layer_1 = new Graphics();
    globals.debug_graphics_layer_2 = new Graphics();
    globals.debug_graphics_layer_3 = new Graphics();
    globals.overlay_graphics = new Graphics();

    

    globals.line_length = 30;
    globals.all_lines_graphics.setStrokeStyle({ color: 0x000000, width: 1 });
    globals.bounding_box_graphics.setStrokeStyle({ color: 0x00ff00, width: 1 });
    globals.debug_graphics_layer_1.setStrokeStyle({ color: 0x00ffff, width: 1 });
    globals.debug_graphics_layer_2.setStrokeStyle({ color: 0x0000ff, width: 1 });
    globals.debug_graphics_layer_3.setStrokeStyle({ color: 0xff00ff, width: 1 });
    globals.overlay_graphics.setStrokeStyle({ color: 0xff00ff, width: 1 });

    globals.viewport.addChild(globals.polygon_graphics);

    globals.viewport.addChild(globals.all_lines_graphics);
    globals.viewport.addChild(globals.bounding_box_graphics);
    globals.viewport.addChild(globals.debug_graphics_layer_1);
    globals.viewport.addChild(globals.debug_graphics_layer_2);
    globals.viewport.addChild(globals.debug_graphics_layer_3);
    globals.viewport.addChild(globals.overlay_graphics);

    globals.particle_container = new Container(256, {
        position: true,
        rotation: false,
        uvs: false,
        tint: true,
    });

    globals.viewport.addChild(globals.particle_container);

    globals.circle_texture = create_circle_texture(app, 3);
}

export function spawn_car(globals, constants, viewport) {
    const tire_1 = make_circle_2(globals);
    tire_1.group = "player"
    tire_1.type = "wheel"
    tire_1.color = constants.tire_color;
    tire_1.floor_friction = .02;
    tire_1.DAMPING = .8;
    tire_1.FRAME_DAMPING = .8;
    globals.tire_1 = tire_1;
    const tire_1_surface = tire_1.surface_vertice_holder;
    globals.tire_axel_1_verts = [ tire_1_surface[0],tire_1_surface[4],tire_1_surface[8],tire_1_surface[12]];


    const tire_2 = make_circle_2(globals);
    tire_2.group = "player"
    tire_2.type = "wheel"
    tire_2.color = constants.tire_color;
    tire_2.floor_friction = .02;
    tire_2.DAMPING = .8;
    tire_2.FRAME_DAMPING = .8;
    globals.tire_2 = tire_2;
    const tire_2_surface = tire_2.surface_vertice_holder;
    globals.tire_axel_2_verts = [ tire_2_surface[0],tire_2_surface[4],tire_2_surface[8],tire_2_surface[12]];


    /*
    */
    const car_body = make_car_body(globals);
    car_body.group = "player"
    car_body.type = "car_body"
    car_body.color = constants.car_body_color;
    globals.car_body = car_body;
    const car_body_surface = car_body.surface_vertice_holder;
    viewport.follow(globals.camera_target, 10, 10)

    globals.car_axel_1_verts = [
        car_body_surface[13],
        car_body_surface[14],
        car_body_surface[15],
        car_body_surface[16],
        car_body_surface[17],
        car_body_surface[0],
        car_body_surface[1],
    ];
    globals.car_axel_2_verts = [
        car_body_surface[4],
        car_body_surface[5],
        car_body_surface[6],
        car_body_surface[7],
        car_body_surface[8],
        car_body_surface[9],
        car_body_surface[10],
    ];
}

export function make_platform_array(globals, constants, amount, start_position, distance_between_x, offset_y) {

    let width = 0;
    for (let i = 0; i < amount; i++) {

        const platform = general_rectangle_builder(globals, 100, 16, 3, true, 5, true)


        platform.update_bounding_box();
        width = platform.bounding_box.right - platform.bounding_box.left;
        globals.level_shapes.add(platform);
        set_shape_position(globals, platform, true, {
            x: start_position.x + i*(width+distance_between_x),
            y: start_position.y + i*(offset_y)
        });
        platform.group = "stage_accessory"
    }

}

export function set_up_event_listeners(globals, elements, constants, app) {

    // General
    elements.settings_close_button.onclick = function() { hide_element(elements.settings_overlay) };
    elements.settings_open_button.onclick = function() { show_element(elements.settings_overlay) };
    elements.show_fps_checkbox.addEventListener('change', function() {
        if (this.checked) {
            elements.fps_counter.classList.remove('hidden');
            elements.level_button_holder.classList.add('level-button-holder-offset');
            
        } else {
            elements.fps_counter.classList.add('hidden');
            elements.level_button_holder.classList.remove('level-button-holder-offset');
        }
    });
    elements.menu_toggle_button.onclick = function() {
        if (elements.menu_holder.classList.contains("hide-menu")) {
            elements.menu_holder.classList.remove("hide-menu");
            elements.up_arrow.classList.remove("hidden");
            elements.down_arrow.classList.add("hidden");

        } else {

            elements.menu_holder.classList.add("hide-menu");
            elements.up_arrow.classList.add("hidden");
            elements.down_arrow.classList.remove("hidden");
        }
        reset_menu_holder_top()
    };

    app.canvas.addEventListener("touchstart", (event) => {
        const touches = event.changedTouches;
        const last_touch = touches[touches.length - 1];

        globals.mouse_screen_position = {x: last_touch.clientX, y: last_touch.clientY};
        globals.mouse_world_position = get_world_position(globals.viewport, globals.mouse_screen_position.x, globals.mouse_screen_position.y);
        globals.drag_mode = true;
        globals.actively_dragging = false;
    });

    app.canvas.addEventListener("touchend", (event) => {
        const touches = event.changedTouches;
        const last_touch = touches[touches.length - 1];
        globals.mouse_screen_position = {x: last_touch.clientX, y: last_touch.clientY};
        globals.mouse_world_position = get_world_position(globals.viewport, globals.mouse_screen_position.x, globals.mouse_screen_position.y);
        globals.drag_mode = false;
        globals.actively_dragging = false;
        if (globals.chosen_dragging_vertex != null) {
            globals.chosen_dragging_vertex.grabbed = false;
        }
        if (globals.grabbed_shape != null) {
            globals.grabbed_shape.grabbed = false;
        }
    });

    app.canvas.addEventListener("touchcancel", (event) => {
        const touches = event.changedTouches;
        const last_touch = touches[touches.length - 1];
        globals.mouse_screen_position = {x: last_touch.clientX, y: last_touch.clientY};
        globals.mouse_world_position = get_world_position(globals.viewport, globals.mouse_screen_position.x, globals.mouse_screen_position.y);
        globals.drag_mode = false;
        globals.actively_dragging = false;
        if (globals.chosen_dragging_vertex != null) {
            globals.chosen_dragging_vertex.grabbed = false;
        }
        if (globals.grabbed_shape != null) {
            globals.grabbed_shape.grabbed = false;
        }
    });

    app.canvas.addEventListener("touchmove", (event) => {
        const touches = event.changedTouches;
        const last_touch = touches[touches.length - 1];
        globals.mouse_screen_position = {x: last_touch.clientX, y: last_touch.clientY};
        globals.mouse_world_position = get_world_position(globals.viewport, globals.mouse_screen_position.x, globals.mouse_screen_position.y);
    });

    app.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    app.canvas.addEventListener("mousedown", (event) => {
        if (event.button == globals.primary_button) {
            globals.drag_mode = true;
            globals.actively_dragging = false;
        }
        

        if (event.button == globals.grav_button) {
            globals.grav_modifier = 10;
        }
    });

    app.canvas.addEventListener("mousemove", (event) => {
        globals.mouse_screen_position = {x: event.clientX, y: event.clientY};
        //globals.mouse_world_position = get_world_position(globals.viewport, globals.mouse_screen_position.x, globals.mouse_screen_position.y);
    });

    app.canvas.addEventListener("mouseup", (event) => {
        if (event.button == globals.primary_button) {
            globals.drag_mode = false;
            globals.actively_dragging = false;
            if (globals.chosen_dragging_vertex != null) {
                globals.chosen_dragging_vertex.grabbed = false;
            }
            if (globals.grabbed_shape != null) {
                globals.grabbed_shape.grabbed = false;
            }
            
        }

        if (event.button == globals.delete_button) {
            for (let i = 0; i < globals.shapes_holder.length; i++) {
                const shape = globals.shapes_holder[globals.shapes_holder.length-1 - i];
                if (globals.drag_mode == false) {
                    if ( point_in_polygon(globals.mouse_world_position, shape) ) {
                        //shape.grab(globals);
                        console.log("delete:", shape)
                        if (shape.left_handle) {

                            shape.left_handle.delete(globals);
                        }
                        if (shape.right_handle) {

                            shape.right_handle.delete(globals);
                        }
                        shape.delete(globals);

                        break
                    }
                }
            }
        }

        if (event.button == globals.grav_button) {
            globals.grav_modifier = 1;
        }
    });

    app.canvas.addEventListener('mouseleave', () => {
        globals.drag_mode = false;
        globals.actively_dragging = false;
        globals.grav_modifier = 1;
        if (globals.grabbed_shape != null) {
            globals.grabbed_shape.grabbed = false;
        }
    });

    elements.draw_frames_checkbox.addEventListener("change", function() {
    if (this.checked) {
        globals.draw_frames = true;
        globals.draw_frame_springs = true;
    } else {
        globals.draw_frames = false;
        globals.draw_frame_springs = false;
    }
    });

    elements.draw_springs_checkbox.addEventListener("change", function() {
    if (this.checked) {
        globals.draw_springs = true;
    } else {
        globals.draw_springs = false;
    }
    });

    elements.draw_vertices_checkbox.addEventListener("change", function() {
        if (this.checked) {
            globals.draw_vertex_particles = true;
        } else {
            globals.draw_vertex_particles = false;
        }
    });
    

    elements.update_itterations_input.addEventListener("change", function() {
        globals.physics_updates_per_tick = this.value;
    });

    function reset_custom_rectangle_menu_height(){
        const standard_custom_rectangle_settings_holder_height = 114
        const extended_frame_settings_holder_height = 76
        //const extended_frame_settings_holder_height = 101
        let target_height = 0
        if (elements.shape_selection_dropdown.value == "custom-rectangle") {
            target_height += standard_custom_rectangle_settings_holder_height
            if (elements.segmented_frame_checkbox.checked) {
                target_height += extended_frame_settings_holder_height
            }
        }
        elements.custom_rectangle_settings_holder.style.height = target_height+'px';
    }

    function reset_frame_settings_holder_height(){
        const extended_frame_settings_holder_height = 176
        //const extended_frame_settings_holder_height = 101
        let target_height = 0
        if (elements.segmented_frame_checkbox.checked) {
            target_height += extended_frame_settings_holder_height
        }
        elements.frame_settings_holder.style.height = target_height+'px';
    }

    function reset_menu_holder_top(){
        if (elements.menu_holder.classList.contains("hide-menu")) {
            const height = elements.menu_holder.offsetHeight;
            elements.menu_holder.style.top = "-"+(height-34)+'px';
        } else {
            elements.menu_holder.style.top = '0px';
        }
    }

    elements.shape_selection_dropdown.addEventListener("change", function() {
        reset_custom_rectangle_menu_height();
    });
    elements.segmented_frame_checkbox.addEventListener("change", function() {
        reset_custom_rectangle_menu_height();
        reset_frame_settings_holder_height();
    });


    reset_custom_rectangle_menu_height();
    reset_frame_settings_holder_height();

    globals.draw_frames = elements.draw_frames_checkbox.checked;
    globals.draw_springs = elements.draw_springs_checkbox.checked;
    globals.draw_vertex_particles = elements.draw_vertices_checkbox.checked;
    globals.draw_vertex_particles = elements.draw_vertices_checkbox.checked;
    globals.physics_updates_per_tick = elements.update_itterations_input.value;
    
    elements.clear_all_button.onclick = function () {
        clear_shapes(globals);
    };
    elements.build_button.onclick = function () {

        let shape_selection_dropdown_value = elements.shape_selection_dropdown.value;

        let shape_to_build;
        if (shape_selection_dropdown_value == "2x2-square") {
            shape_to_build = general_rectangle_builder(globals, 100, 2, 2, false, 3, false)
        } else if (shape_selection_dropdown_value == "4x4-square") {
            shape_to_build = general_rectangle_builder(globals, 100, 4, 4, false, 3, false)
        } else if (shape_selection_dropdown_value == "circle") {
            shape_to_build = make_circle_1(globals);
        } else if (shape_selection_dropdown_value == "circle-2") {
            shape_to_build = make_circle_2(globals);
        } else if (shape_selection_dropdown_value == "quad") {
            shape_to_build = make_quad(globals);
        } else if (shape_selection_dropdown_value == "2x8-rectangle") {
            shape_to_build = general_rectangle_builder(globals, 100, 8, 2, false, 3, false)
        } else if (shape_selection_dropdown_value == "2x12-rectangle") {
            shape_to_build = general_rectangle_builder(globals, 100, 12, 2, true, 5, false)
        } else if (shape_selection_dropdown_value == "3x12-rectangle") {
            shape_to_build = general_rectangle_builder(globals, 100, 12, 3, true, 5, false)
        } if (elements.shape_selection_dropdown.value == "custom-rectangle") {
            const width = elements.custom_rectangle_width_input.value;
            const height = elements.custom_rectangle_height_input.value;
            const segmented_frame = elements.segmented_frame_checkbox.checked;
            const segment_width = elements.segment_width_input.value;
            const fixed_ends = elements.fixed_ends_checkbox.checked;
            shape_to_build = general_rectangle_builder(globals, 100, width, height, segmented_frame, segment_width, fixed_ends)
        }

        const padding = 40;
        const top_padding = 20;
        const left_padding = padding;
        const target_upper_left = {x: globals.viewport.left + left_padding, y: globals.viewport.top + top_padding};
        set_shape_position(globals, shape_to_build, true, target_upper_left);
        
    };

    window.addEventListener("resize", () => {
        reset_menu_holder_top()
    });
}

export function set_up_event_listeners_car_level(globals, elements, constants, app) {
    // For car
    window.addEventListener("resize", () => {
        if ( globals.viewport ) {
            globals.viewport.screenWidth = window.innerWidth;
            globals.viewport.screenHeight = window.innerHeight;
        }
    });

    elements.controls_close_button.onclick = function() { hide_element(elements.controls_overlay) };

    window.addEventListener("keydown", (event) => {
        globals.keys_pressed[String(event.key).toLowerCase()] = true;
    });

    window.addEventListener("keyup", (event) => {
        delete globals.keys_pressed[String(event.key).toLowerCase()];
        if (event.key == " " && globals.car_body) {
            globals.queued_fire = true;
        }
    });
}