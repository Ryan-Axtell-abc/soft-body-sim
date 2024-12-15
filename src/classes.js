import { Graphics, Point, Ticker } from 'pixi.js';

import { angle_between_vectors, average_angle_from_list, get_distance_between_points, mod, point_in_polygon, rotate_vector } from './functions.js'


export class Constants {
	constructor() {
		this.DRAG = .995;
		this.GRAVITY = 980;
		this.FIXED_TIME_STEP = 1/60;

		this.fixed_ground_color = 0xffff00;
        this.mud_color = 0x8a3f00;
        this.tire_color = 0x01ffc5;
        this.tire_color = 0x00ff9e;
        this.tire_color = 0x4fff4f;
        this.car_body_color = 0x0088ff;
        this.stage_accessories_color = 0x9526ff;
        this.stage_accessories_color = 0x66CCFF;
        
        this.button_unpressed_color = 0xff5e5e;
        this.button_pressed_color = 0x01ffc5;
	}
}

export class Globals {
	constructor() {
        this.all_lines_graphics = new Graphics();
        this.particle_container;
        this.render_offset_x = 100;
        this.render_offset_y = 100;
        this.render_scale = 1

        this.drag_mode = false;
        this.actively_dragging = false;
        this.grabbed_shape;

        this.drag_snap_distance = 10;;
        this.chosen_dragging_vertex = null;
        this.line_length;
        this.mouse_world_position = {x:0, y:0};
        this.mouse_screen_position = {x:0, y:0};

        this.grav_modifier = 1;

        this.constraint_itterations = 8;

        this.primary_button = 0;
        this.grav_button = 1;
        this.delete_button = 2;

        this.paused = false;
        this.primary_button_clicked = false;
        this.shape_vertices = []
        this.circle_texture ;
        this.polygon_graphics = new Graphics();

        this.closest_vertex = null;
        this.shapes_holder = [];
        this.accelerators_holder = [];
        this.app;
        this.viewport;


        this.bounding_box_graphics = new Graphics();

        this.debug_graphics_layer_1 = new Graphics();
        this.debug_graphics_layer_2 = new Graphics();
        this.debug_graphics_layer_3 = new Graphics();
        this.overlay_graphics = new Graphics();
        this.imaginary_points = [];

        this.raycast_line_segments = [];
        this.edge_normals = [];
        //this.first_picks = [];
        this.second_pick_edges = [];
        this.physics_multiplier = 1/1;

        this.mouse_down

        this.player_group = []
        this.keys_pressed = new Map();

        this.car_axel_1_verts = [];
        this.car_axel_2_verts = [];
        this.tire_axel_1_verts = [];
        this.tire_axel_2_verts = [];
        this.car_body;
        this.tire_1;
        this.tire_2;

        this.draw_frames = false;
        this.draw_springs = false;
        this.draw_frame_springs = false;
        this.draw_vertex_particles = false;


        this.playing = true;

        this.shake_until = 0;
        this.shake_intensity = 10;

        this.cannon_animate_until = 0;
        this.cannon_animate_duration = 150;

        this.last_frame_viewport_x = 0;
        this.last_frame_viewport_y = 0;

        this.start_time = 0;
        this.queued_fire = false;
        this.cannon_center = {x: 0, y: 0};
        this.launch_direction = {x: 0, y: 0};

        this.grab_vectors_holder = [];
        this.grab_weights_holder = [];
        this.grabbed_shape;
        this.grab_radius = 200;

        this.camera_target = new Point();

        this.level_shapes = new Set();
        this.physics_independent_from_frame_rate = false;

        this.physics_time = 0;
        this.physics_updates_per_tick = 2;

        this.unpressed_buttons = new Set();
        this.has_won = false;

        this.ball_launch_multiplier = 2;
        this.ball_color = 0x66CCFF;

        this.closed_room = false;

        this.handles_holder = [];
        this.handle_radius = 20;
	}
}

export class Elements {
	constructor() {
        this.cloth_sim_holder = document.getElementById("cloth-sim-holder");
        this.settings_overlay = document.getElementById("settings-overlay");
        this.controls_overlay = document.getElementById("controls-overlay");
        this.settings_close_button = document.getElementById("settings-close-button");
        this.settings_open_button = document.getElementById("settings-open-button");
        this.controls_close_button = document.getElementById("controls-close-button");
        this.build_button = document.getElementById("build-button");
        this.play_toggle_button = document.getElementById("play-toggle-button");
        this.clear_all_button = document.getElementById("clear-all-button");
        this.menu_holder = document.getElementById("menu-holder");
        this.menu_toggle_button = document.getElementById("menu-toggle-button");
        this.up_arrow = document.getElementById("up-arrow");
        this.down_arrow = document.getElementById("down-arrow");
        this.fps_counter;
        this.show_fps_checkbox = document.getElementById("show-fps-checkbox");
        this.shape_selection_dropdown = document.getElementById("shape-selection-dropdown");
        this.draw_springs_checkbox = document.getElementById("draw-springs-checkbox");
        this.draw_frames_checkbox = document.getElementById("draw-frames-checkbox");
        this.draw_frame_springs_checkbox = document.getElementById("draw-frame-springs-checkbox");
        this.draw_vertices_checkbox = document.getElementById("draw-vertices-checkbox");
        this.update_itterations_input = document.getElementById("update-itterations-input");
        this.level_button_holder = document.getElementById("level-button-holder");
        this.segmented_frame_checkbox = document.getElementById("segmented-frame-checkbox");
        this.frame_settings_holder = document.getElementById("frame-settings-holder");
        this.custom_rectangle_settings_holder = document.getElementById("custom-rectangle-settings-holder");
        this.custom_rectangle_width_input = document.getElementById("custom-rectangle-width-input");
        this.custom_rectangle_height_input = document.getElementById("custom-rectangle-height-input");
        this.segmented_frame_checkbox = document.getElementById("segmented-frame-checkbox");
        this.segment_width_input = document.getElementById("segment-width-input");
        this.fixed_ends_checkbox = document.getElementById("fixed-ends-checkbox");
        
        
	}
}

export class Shape {
    constructor(surface_vertice_holder, inner_vertice_holder, frame_collection, spring_holder, frame_spring_holder) {
        this.surface_vertice_holder = surface_vertice_holder;
        this.inner_vertice_holder = inner_vertice_holder;
        this.frame_collection = frame_collection;

        this.spring_holder = spring_holder;
        this.frame_spring_holder = frame_spring_holder;

        this.particle_holder = [];
        this.particle_container;


        this.bounding_box = {left:0, right:0, top:0, bottom: 0, intersecting: false, intersecting_shapes_list: []}
        this.color = 0x66CCFF;
        this.uses_frame = true;
		this.DAMPING = .2;
		this.FRAME_DAMPING = .2;

        this.grabbed = false;
        this.local_mouse_grab_point = { x:0, y:0,};
        this.angle_when_grabbed = 0;
        this.last_average_angle = 0;

        this.group;
        this.type;
        this.floor_friction = .5;
        this.offset_x = 0;
        this.pre_lerp_target_x = 0;

        this.is_raising = false;
        this.max_raised_amount = 0;
        this.starting_center = 0;
        this.button_index = 0;
        this.frame_handle_left;
        this.frame_handle_right;
    }
    
    update_vertices(globals, constants, dt) {
        let floor 
        if (globals.closed_room) {
            floor = window.innerHeight - 100
        } else {

            floor = 8000;
        }
        //floor = 600
        for (let vertex of this.surface_vertice_holder) {

            const vx = ((vertex.x - vertex.prev_x) + vertex.extra_vx) * constants.DRAG;
            const vy = ((vertex.y - vertex.prev_y) + vertex.extra_vy) * constants.DRAG + constants.GRAVITY * globals.physics_multiplier * globals.physics_multiplier * globals.grav_modifier * dt * dt;
            vertex.extra_vx = 0;
            vertex.extra_vy = 0;
    
            vertex.prev_x = vertex.x;
            vertex.prev_y = vertex.y;

            if (vertex.y > floor) {
                vertex.touching = true;
            }

            if (!vertex.grabbed) {
                if (vertex.touching) {
                    vertex.x += vx*this.floor_friction;
                    vertex.y += vy*this.floor_friction;

                } else {
                    vertex.x += vx;
                    vertex.y += vy;
                }
            } else {
                vertex.x = globals.mouse_world_position.x;
                vertex.y = globals.mouse_world_position.y;
    
            }

            if (globals.closed_room) {
                if (vertex.x < 0) {
                    vertex.x = 0;
                }
                if (vertex.x > window.innerWidth) {
                    vertex.x = window.innerWidth;
                }
                

            }

            if (vertex.y > floor) {
                vertex.y = floor;
            }
        }

        for (let vertex of this.inner_vertice_holder) {
            const vx = (vertex.x - vertex.prev_x) * constants.DRAG;
            const vy = (vertex.y - vertex.prev_y) * constants.DRAG + constants.GRAVITY * globals.physics_multiplier * globals.physics_multiplier * globals.grav_modifier * dt * dt;
    
            vertex.prev_x = vertex.x;
            vertex.prev_y = vertex.y;
            if (!vertex.grabbed) {
                vertex.x += vx;
                vertex.y += vy;
            } else {
                vertex.x = globals.mouse_world_position.x;
                vertex.y = globals.mouse_world_position.y;
    
            }
            if (vertex.y > floor) {
                vertex.y = floor;
            }
        }
    }

    calculate_center() {
        if ( this.surface_vertice_holder.length > 0 ) {
            var x_sum = 0;
            var y_sum = 0;
    
            for (let vertex of this.surface_vertice_holder) {
                x_sum += vertex.x;
                y_sum += vertex.y;
            }
            var x_average = x_sum/this.surface_vertice_holder.length;
            var y_average = y_sum/this.surface_vertice_holder.length;
            return {x:x_average, y:y_average}

        } else {
            return {x:0, y:0}
        }
    }

    calculate_center_of_certain_verts(verts) {
        if ( verts.length > 0 ) {
            var x_sum = 0;
            var y_sum = 0;
    
            for (let vertex of verts) {
                x_sum += vertex.x;
                y_sum += vertex.y;
            }
            var x_average = x_sum/verts.length;
            var y_average = y_sum/verts.length;
            return {x:x_average, y:y_average}

        } else {
            return {x:0, y:0}
        }
    }

    calculate_area() {
        const vertices = this.surface_vertice_holder;
        // Shoelace method
        let area = 0;
        
        // Loop through all vertices
        for(let i = 0; i < vertices.length; i++) {
            // Get next vertex (wrapping around to 0 at the end)
            const j = (i + 1) % vertices.length;
            
            // Add x1*y2
            area += vertices[i].x * vertices[j].y;
            // Subtract x2*y1
            area -= vertices[j].x * vertices[i].y;
        }
        
        // Take absolute value and divide by 2
        return Math.abs(area) * 0.5;
    }

    calculate_average_angle_to_frame(center, collection, body_verts, print) {
        var angle_list = [];
        for (let i = 0; i < collection.length; i++) {
            const surface_vertex = body_verts[i];
            const frame_vertex = collection[i];

            const surface_vertex_relative_to_center = {x:surface_vertex.x - center.x, y:surface_vertex.y - center.y};
            const frame_vertex_relative_to_center = {x:frame_vertex.x - center.x, y:frame_vertex.y - center.y};

            const angle = angle_between_vectors(surface_vertex_relative_to_center, frame_vertex_relative_to_center)
            
            angle_list.push(angle);
        }

        let average_angle = average_angle_from_list(angle_list);
        return average_angle;
    }

    grab(globals) {
        //First I want to set the vector from the mouse to each vertex
        const combined_vertice_holder = this.surface_vertice_holder.concat(this.inner_vertice_holder);
        const mouse_to_vertex_vector_holder = [];
        const grab_weights_holder = [];
        for (let i = 0; i < combined_vertice_holder.length; i++) {
            const vertex = combined_vertice_holder[i];
            const mouse_to_vertex_vector = {
                x: vertex.x - globals.mouse_world_position.x,
                y: vertex.y - globals.mouse_world_position.y,
            }
            mouse_to_vertex_vector_holder.push(mouse_to_vertex_vector)
            const distance_to_mouse = Math.sqrt(mouse_to_vertex_vector.x**2 + mouse_to_vertex_vector.y**2);
            let linear_grab_strength = 1 - Math.min(distance_to_mouse/globals.grab_radius, 1);
            let grab_strength = linear_grab_strength**3;
            if (grab_strength > .9 ) {
                grab_strength = 1
            }
            grab_weights_holder.push(grab_strength);
        }
        globals.actively_dragging = true;
        globals.grab_vectors_holder = mouse_to_vertex_vector_holder;


        
        globals.grab_weights_holder = grab_weights_holder;

        globals.grabbed_shape = this;
    }

    update_frame_transform(globals) {

        //Okay so basically instead of having one frame we now can have an arbitrary number of frames, in the this.frame_collection
        for (let i = 0; i < this.frame_collection.length; i++) {
            const frame_data_pack = this.frame_collection[i]
            const frame_verts = frame_data_pack.vertex_arrays.frame_vertices;
            const body_verts = frame_data_pack.vertex_arrays.body_vertices;

            if (frame_data_pack.fixed) {
                if (this.is_raising) {
                    const raise_percentage = ((Math.cos(globals.physics_time*2/Math.PI - Math.PI)+1)/2);
                    const raised_y_value = this.starting_center.y + (this.max_raised_amount * raise_percentage)

                    for (let frame_vertex of frame_verts) {
                        frame_vertex.y = raised_y_value + frame_vertex.offset_y;
                    }
                    
                    
                } else if (this.frame_collection.length > 1) {
                    //console.log("mulitple", i, this.frame_collection.length)
                    if (i == 0 && this.left_handle) {
                        //console.log("left", this.left_handle, this)
                        for (let frame_vertex of frame_verts) {
                            frame_vertex.x = this.left_handle.x + frame_vertex.offset_x;
                            frame_vertex.y = this.left_handle.y + frame_vertex.offset_y;
                        }
                    } else if (i == this.frame_collection.length-1 && this.right_handle) {
                        //console.log("right")
                        for (let frame_vertex of frame_verts) {
                            frame_vertex.x = this.right_handle.x + frame_vertex.offset_x;
                            frame_vertex.y = this.right_handle.y + frame_vertex.offset_y;
                        }
                    }
                }
            } else {
                const center_of_this_section = this.calculate_center_of_certain_verts(body_verts);

                for (let frame_vertex of frame_verts) {
                    frame_vertex.x = center_of_this_section.x + frame_vertex.offset_x;
                    frame_vertex.y = center_of_this_section.y + frame_vertex.offset_y;
                }

                var average_angle = this.calculate_average_angle_to_frame(center_of_this_section, frame_verts, body_verts);

                for (let frame_vertex of frame_verts) {

                    let updated_frame_offset = rotate_vector({x: frame_vertex.offset_x, y: frame_vertex.offset_y}, (-average_angle));
                    if ( this.group == "player" && this.type == "wheel") {
                        let drive_rotation = 0;
                        const left_pressed = globals.keys_pressed["ArrowLeft".toLowerCase()] || globals.keys_pressed["a"];
                        const right_pressed = globals.keys_pressed["ArrowRight".toLowerCase()] || globals.keys_pressed["d"];
                        if (left_pressed && right_pressed) {
                            drive_rotation = 0;
                        } else if (left_pressed) {
                            drive_rotation = -.0209
                        } else if (right_pressed) {
                            drive_rotation = .0209
                        }
                        updated_frame_offset = rotate_vector({x: frame_vertex.offset_x, y: frame_vertex.offset_y}, (-average_angle + drive_rotation));
                    }
                    
                    frame_vertex.x = center_of_this_section.x + updated_frame_offset.x;
                    frame_vertex.y = center_of_this_section.y + updated_frame_offset.y;
                }
            }
        }
    }

    update_frame_springs(globals, constants) {

        // Calculate and store all corrections before applying any
        const corrections = new Map();  // Using Map to store corrections for each vertex

        for (let frame_data_pack of this.frame_collection) {
            const frame_spring_list = frame_data_pack.spring_list;
            for (let frame_spring of frame_spring_list) {
                const vertex = frame_spring.surface_vertex;
                corrections.set(vertex, {x: 0, y: 0});

            }
        }


        for (let frame_data_pack of this.frame_collection) {
            const frame_spring_list = frame_data_pack.spring_list;

            for (let frame_spring of frame_spring_list) {
                const frame_vertex = frame_spring.frame_vertex;
                const surface_vertex = frame_spring.surface_vertex;

                const distance_x = frame_vertex.x - surface_vertex.x;
                const distance_y = frame_vertex.y - surface_vertex.y;

                if (!surface_vertex.grabbed) {
                    const correction_value = corrections.get(surface_vertex);
                    //surface_vertex.x += distance_x * this.DAMPING;
                    //surface_vertex.y += distance_y * this.DAMPING;
                    correction_value.x += distance_x * this.FRAME_DAMPING;
                    correction_value.y += distance_y * this.FRAME_DAMPING;
                }

            }
        }
    
        // Apply all corrections at once
        for (let [vertex, correction] of corrections) {
            if (!vertex.grabbed) {
                vertex.x += correction.x;
                vertex.y += correction.y;
            }
        }
    }

    update_camera_target(globals) {
        const actual_center = this.calculate_center();

        const left_pressed = globals.keys_pressed["ArrowLeft"] || globals.keys_pressed["a"] || globals.keys_pressed["A"];
        const right_pressed = globals.keys_pressed["ArrowRight"] || globals.keys_pressed["d"] || globals.keys_pressed["D"];

        if (left_pressed && right_pressed) {
        } else if (left_pressed) {
            this.offset_x = -150;
        } else if (right_pressed) {
            this.offset_x = 150;
        }
        this.pre_lerp_target_x += ((actual_center.x + this.offset_x) - this.pre_lerp_target_x) * .1;
        const pre_lerp_target_y = actual_center.y;

        globals.camera_target.x += (this.pre_lerp_target_x - globals.camera_target.x) * .3;
        globals.camera_target.y += (pre_lerp_target_y - globals.camera_target.y) * .3;
    }
    

    update_particles(globals) {
        const combined_vertice_holder = this.surface_vertice_holder.concat(this.inner_vertice_holder);
        for (let i = 0; i < combined_vertice_holder.length; i++) {
            const vertex = combined_vertice_holder[i];
            const particle = this.particle_holder[i];


            particle.position.set(vertex.x*globals.render_scale, vertex.y*globals.render_scale);
            if (vertex.hovered == true) {
                particle.position.set(vertex.x*globals.render_scale, vertex.y*globals.render_scale - 2);
            }

        }

    }

    update_bounding_box() {
        const first_vertex = this.surface_vertice_holder[0];
        this.bounding_box = {left:first_vertex.x, right:first_vertex.x, top:first_vertex.y, bottom: first_vertex.y}
        for (let i = 1; i < this.surface_vertice_holder.length; i++) {
            const vertex = this.surface_vertice_holder[i];

            this.bounding_box.left = Math.min(this.bounding_box.left, vertex.x);
            this.bounding_box.right = Math.max(this.bounding_box.right, vertex.x);
            this.bounding_box.top = Math.min(this.bounding_box.top, vertex.y);
            this.bounding_box.bottom = Math.max(this.bounding_box.bottom, vertex.y);

        }
    }

    clear_touching() {
        for (let i = 0; i < this.surface_vertice_holder.length; i++) {
            const vertex = this.surface_vertice_holder[i];
            vertex.touching = false;
        }
    }

    update_springs(globals, constants) {
        // Calculate and store all corrections before applying any
        const corrections = new Map();  // Using Map to store corrections for each vertex
        
        // Initialize corrections map
        var combined_vertice_holder = this.surface_vertice_holder.concat(this.inner_vertice_holder);
        for (let vertex of combined_vertice_holder) {
            corrections.set(vertex, {x: 0, y: 0});
        }        
        
        for (let spring of this.spring_holder) {
            const vertex_1 = spring.vertex_1;
            const vertex_2 = spring.vertex_2;

            const distance_x = vertex_2.x - vertex_1.x;
            const distance_y = vertex_2.y - vertex_1.y;
            let distance = Math.sqrt(distance_x**2 + distance_y**2);

            if (distance < 0.00001) {
                distance = 0.00001
            }

            const difference = (spring.length - distance) / distance;

            const correction_x = distance_x * difference * 0.5;
            const correction_y = distance_y * difference * 0.5;

            if (!vertex_1.grabbed) {
                const correction_value_1 = corrections.get(vertex_1);
                correction_value_1.x -= correction_x * this.FRAME_DAMPING;
                correction_value_1.y -= correction_y * this.FRAME_DAMPING;
            }
            if (!vertex_2.grabbed) {
                const correction_value_2 = corrections.get(vertex_2);
                correction_value_2.x += correction_x * this.FRAME_DAMPING;
                correction_value_2.y += correction_y * this.FRAME_DAMPING;
            }
        }
    
        // Apply all corrections at once
        for (let [vertex, correction] of corrections) {
            if (!vertex.grabbed) {
                vertex.x += correction.x;
                vertex.y += correction.y;
            }
        }
    }

    delete(globals) {
        // Remove from any physics update loops/callbacks
        if (this == globals.car_body) {
            globals.car_body = null;
            globals.car_axel_1_verts = [];
            globals.car_axel_2_verts = [];
        }
        if (this == globals.tire_1) {
            globals.tire_1 = null;
            globals.tire_axel_1_verts = [];
        }

        if (this == globals.tire_2) {
            globals.tire_2 = null;
            globals.tire_axel_2_verts = [];
        }
        
        globals.shapes_holder = globals.shapes_holder.filter(s => s !== this);
        
        this.surface_vertice_holder = [];
        this.inner_vertice_holder = [];
        this.frame_collection = [];

        this.spring_holder = [];
        this.frame_spring_holder = [];

        this.particle_holder = [];
        this.particle_container.destroy({children: true});
    }
}


export class Accelerator {
    constructor(surface_vertice_holder) {
        this.surface_vertice_holder = surface_vertice_holder;

        this.bounding_box = {left:0, right:0, top:0, bottom: 0, intersecting: false, intersecting_shapes_list: []}
        this.color = 0x66CCFF;

        this.group;
        this.type;
        this.x_force = 0;
        this.y_force = 0;
    }

    update_bounding_box() {
        const first_vertex = this.surface_vertice_holder[0];
        this.bounding_box = {left:first_vertex.x, right:first_vertex.x, top:first_vertex.y, bottom: first_vertex.y}
        for (let i = 1; i < this.surface_vertice_holder.length; i++) {
            const vertex = this.surface_vertice_holder[i];

            this.bounding_box.left = Math.min(this.bounding_box.left, vertex.x);
            this.bounding_box.right = Math.max(this.bounding_box.right, vertex.x);
            this.bounding_box.top = Math.min(this.bounding_box.top, vertex.y);
            this.bounding_box.bottom = Math.max(this.bounding_box.bottom, vertex.y);

        }
    }

    delete(globals) {

        globals.shapes_holder = globals.shapes_holder.filter(s => s !== this);
        
        this.surface_vertice_holder = [];

        this.particle_holder = [];
        this.particle_container.destroy({children: true});
    }
}

export class Handle {
    constructor(x, y, verts, shape) {
        this.x = x;
        this.y = y;
        this.verts = verts;
        this.shape = shape;
        this.is_handle = true;
    }

    grab(globals) {
        globals.actively_dragging = true;
        globals.grabbed_shape = this;
    }

    update(globals) {
        const average_position = this.shape.calculate_center_of_certain_verts(this.verts);
        this.x = average_position.x;
        this.y = average_position.y;
    }

    delete(globals) {
        globals.handles_holder = globals.handles_holder.filter(s => s !== this);
        this.verts = [];
        this.shape = undefined;
    }

}