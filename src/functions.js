import { Container, Graphics, Point, Sprite } from "pixi.js";
import { Constants, Elements, Globals, Shape } from "./classes.js";
import { make_cannon_ball } from "./shape_building.js";


// Simple functions


export function hide_element(element) {
    element.classList.add("hidden");
}

export function show_element(element) {
    element.classList.remove("hidden");
}

export function mod(n, m) {
    return ((n % m) + m) % m;
}



function ccw(A, B, C) {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
}

export function intersect(A, B, C, D) {
    // Return true if line segments AB and CD intersect
    return ccw(A, C, D) != ccw(B, C, D) && ccw(A, B, C) != ccw(A, B, D);
}

function dot(vector_a, vector_b) {
    return vector_a.x * vector_b.x + vector_a.y * vector_b.y;
}

export function perpendicular(vector) {
    return {
        x: -vector.y,
        y: vector.x,
    }
}

export function get_distance_between_points(point_a, point_b) {
    let dx = point_b.x - point_a.x;
    let dy = point_b.y - point_a.y;
    let distance = Math.hypot(dx, dy);
    return distance;
}



export function shake_screen(globals, viewport) {
    let random_x = Math.random() * 2 - 1;
    let random_y = Math.random() * 2 - 1;
    const distance_squared = random_x**2 + random_y**2;
    const distance = Math.sqrt(distance_squared);
    if (distance_squared < 1) {
        random_x /= distance;
        random_y /= distance;
    }

    const offset_x = random_x * globals.shake_intensity;
    const offset_y = random_y * globals.shake_intensity;

    viewport.position._x += offset_x;
    viewport.position._y += offset_y;
}



export function create_fps_counter() {
    var script = document.createElement("script");
    script.onload = function () {
        var stats = new Stats();
        document.body.appendChild(stats.dom);
        stats.dom.id = "fps-counter-element";
        requestAnimationFrame(function loop() {
            stats.update();
            requestAnimationFrame(loop);
        });
    };
    script.src = "https://mrdoob.github.io/stats.js/build/stats.min.js";
    document.head.appendChild(script);
}

export function draw_graphics(globals) {
    globals.all_lines_graphics.clear();
    globals.polygon_graphics.clear();
    globals.bounding_box_graphics.clear();
    globals.overlay_graphics.clear();

    for (let shape of globals.shapes_holder) {
        //let color_to_use = shape.bounding_box.intersecting ? 0xffff00 : shape.color;
        let color_to_use = shape.color;
        globals.polygon_graphics.beginFill(color_to_use);
        globals.polygon_graphics.lineStyle(1, 0xff0000);

        globals.polygon_graphics.drawPolygon(shape.surface_vertice_holder);
        globals.polygon_graphics.endFill();

        globals.all_lines_graphics.beginPath();


        if (globals.draw_springs) {
            for (let spring of shape.spring_holder) {
                const vertex_1 = spring.vertex_1;
                const vertex_2 = spring.vertex_2;

                globals.all_lines_graphics.moveTo( vertex_1.x, vertex_1.y );
                globals.all_lines_graphics.lineTo( vertex_2.x, vertex_2.y );
            }
        }

        if (globals.draw_frames) {
            for (let frame_data_pack of shape.frame_collection) {
                const frame_verts = frame_data_pack.vertex_arrays.frame_vertices;
                for (let i = 0; i < frame_verts.length; i++) {
                    const current_frame_vertex = frame_verts[i];
                    const prev_frame_vertex_index = mod(i-1, frame_verts.length);
                    const prev_frame_vertex = frame_verts[prev_frame_vertex_index];

                    globals.all_lines_graphics.moveTo( prev_frame_vertex.x, prev_frame_vertex.y );
                    globals.all_lines_graphics.lineTo( current_frame_vertex.x, current_frame_vertex.y );
                }
            }
        }

        if (globals.draw_frame_springs) {
              for (let frame_data_pack of shape.frame_collection) {
                const frame_spring_list = frame_data_pack.spring_list;

                for (let frame_spring of frame_spring_list) {
                    const frame_vertex = frame_spring.frame_vertex;
                    const surface_vertex = frame_spring.surface_vertex;
    
                    globals.all_lines_graphics.moveTo( frame_vertex.x, frame_vertex.y );
                    globals.all_lines_graphics.lineTo( surface_vertex.x, surface_vertex.y );

                }
            }
        }

        globals.all_lines_graphics.stroke();
    }

    for (let accelerator of globals.accelerators_holder) {
        let color_to_use = accelerator.color;
        globals.polygon_graphics.beginFill(color_to_use, .5);
        globals.polygon_graphics.lineStyle(1, 0xff0000);

        globals.polygon_graphics.drawPolygon(accelerator.surface_vertice_holder);
        globals.polygon_graphics.endFill();
    }

    for (let shape of globals.shapes_holder) {
        if (globals.draw_vertex_particles) {
            shape.particle_container.visible = true;
            shape.update_particles(globals);
        } else {
            shape.particle_container.visible = false;

        }
    }
    if (globals.car_body) { 
        //Draw a circle above the car
        const charge = 20;
        globals.all_lines_graphics.beginPath();
        //d globals.all_lines_graphics.lineStyle(1, 0xFF0000);  // line width of 2, red color
        const cannon_center = globals.cannon_center;

        let radius = 45;
        globals.all_lines_graphics.drawCircle(cannon_center.x, cannon_center.y, radius);
        const charge_vector_distance = get_distance_between_points(cannon_center, globals.mouse_world_position);
        const charge_vector = {
            x: (globals.mouse_world_position.x - cannon_center.x)/charge_vector_distance * charge,
            y: (globals.mouse_world_position.y - cannon_center.y)/charge_vector_distance * charge,
        }
        globals.launch_direction = charge_vector;
        globals.all_lines_graphics.moveTo( cannon_center.x, cannon_center.y );
        globals.all_lines_graphics.lineTo( cannon_center.x + charge_vector.x, cannon_center.y + charge_vector.y );

        globals.all_lines_graphics.stroke();
    }

    for (let handle of globals.handles_holder) {

        globals.overlay_graphics.beginPath();
        globals.overlay_graphics.lineStyle(4, 0xffFF00);
        globals.overlay_graphics.drawCircle(handle.x, handle.y, globals.handle_radius);
        globals.overlay_graphics.stroke();
    }

}

export function calculate_center(verts_array) {
    if ( verts_array.length > 0 ) {
        var x_sum = 0;
        var y_sum = 0;

        for (let vertex of verts_array) {
            x_sum += vertex.x;
            y_sum += vertex.y;
        }
        var x_average = x_sum/verts_array.length;
        var y_average = y_sum/verts_array.length;
        return {x:x_average, y:y_average}

    } else {
        return {x:0, y:0}
    }
}

export function cannon_radius(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;

    const ease_in_back = c3 * x * x * x - c1 * x * x;
    console.log("ease_in_back",ease_in_back)
    //return 80 
    return 60-(ease_in_back*15);

}

export function angle_between_vectors(vector_1, vector_2) {
    let angle_a = Math.atan2(vector_1.y, vector_1.x);
    let angle_b = Math.atan2(vector_2.y, vector_2.x);

    let angle_difference = angle_b - angle_a;

    return angle_difference;
}

export function average_angle_from_list(angle_list) {
    let sum_sin = 0;
    let sum_cos = 0;

    for (let i = 0; i < angle_list.length; i++) {
        sum_sin += Math.sin(angle_list[i]);
        sum_cos += Math.cos(angle_list[i]);
    }

    // Compute the average angle using atan2
    let average = Math.atan2(sum_sin, sum_cos);

    return average;
}

export function rotate_vector(vector, angle) {
    const rotated_x = vector.x * Math.cos(angle) - vector.y * Math.sin(angle);
    const rotated_y = vector.x * Math.sin(angle) + vector.y * Math.cos(angle);

    return { x: rotated_x, y: rotated_y };
}

export function point_in_polygon(vertex, shape) {
    if (vertex.x < shape.bounding_box.right && vertex.x > shape.bounding_box.left && vertex.y < shape.bounding_box.bottom && vertex.y > shape.bounding_box.top) {
            
        let count = 0;
        const n_vertices = shape.surface_vertice_holder.length;

        // Loop through each edge of the polygon
        for (let i = 0; i < n_vertices; i++) {
            let line_end_1 = shape.surface_vertice_holder[i];
            let line_end_2 = shape.surface_vertice_holder[(i + 1) % n_vertices];

            if (edge_intersects_horizontal_ray(vertex, line_end_1, line_end_2)) {
                count++;
            }
        }
        // If count is odd, point is inside the polygon
        return count % 2 === 1;
    }
}

function edge_intersects_horizontal_ray(vertex, line_end_1, line_end_2) {
    // First, check if the point's y-coordinate is within the vertical range of the edge
    // The way pixijs works is that y is greater further down, so the larger value is the bottom
    const top_line_end_y = Math.min(line_end_1.y, line_end_2.y);
    const bottom_line_end_y = Math.max(line_end_1.y, line_end_2.y);

    if (vertex.y < top_line_end_y || vertex.y > bottom_line_end_y) {
        return false; // Edge is not crossed by the horizontal line at point_y
    }

    // Check if the edge is horizontal
    if (line_end_1.y === line_end_2.y) {
        // Check if the point is on the horizontal edge
        if (line_end_1.y === vertex.y) {
            //point is vertically aligned with the horizontal edge
            const left_line_end =
                line_end_1.x < line_end_2.x ? line_end_1 : line_end_2;
            const right_line_end =
                line_end_1.x > line_end_2.x ? line_end_1 : line_end_2;

            if (vertex.x > left_line_end.x && vertex.x < right_line_end.x) {
                //vertex.x is between the line ends
                return true;
            }
        }
        return false; // Horizontal edge does not intersect the ray
    }

    // Compute the x-coordinate of the intersection point, x = (y+b)/m
    const line_change_in_x = line_end_2.x - line_end_1.x;
    const line_change_in_y = line_end_2.y - line_end_1.y;
    const m = line_change_in_y / line_change_in_x;
    //we'll pick line_end_1 to be the origin, so b = 0
    //That means the vertical level where we do our check needs to be shifted so that it's in terms of our new origin but still the same relative to our line
    const y = vertex.y - line_end_1.y;

    //After finding the x-coordinate of the intersection point we need to add the x value fo line_end_1 to it to put it back into global coordinates
    let intersect_x = line_end_1.x + y / m;

    //let intersect_x = line_end_1.x + ((vertex.y - line_end_1.y) * line_change_in_x) / line_change_in_y;

    // Check if the intersection point is to the right of vertex.x
    return intersect_x > vertex.x;
}

export function closest_edge(globals, vertex, shape) {
    let nearest_edge = null;
    let nearest_edge_distance = Infinity;

    const n_vertices = shape.surface_vertice_holder.length;
    // Loop through each edge of the polygon
    for (let i = 0; i < n_vertices; i++) {
        const edge_point_a = shape.surface_vertice_holder[i];
        const edge_point_b = shape.surface_vertice_holder[(i + 1) % n_vertices];

        // Compute the vector from A to B
        const ab_vector = {
            x: edge_point_b.x - edge_point_a.x,
            y: edge_point_b.y - edge_point_a.y,
        };

        // Compute the vector from A to P
        const ap_vector = {
            x: vertex.x - edge_point_a.x,
            y: vertex.y - edge_point_a.y,
        };

        const t = dot(ap_vector, ab_vector) / dot(ab_vector, ab_vector);
        const clamped_t = Math.min(1, Math.max(0, t));

        const vertex_projected_onto_edge = {
            x: edge_point_a.x + clamped_t * ab_vector.x,
            y: edge_point_a.y + clamped_t * ab_vector.y,
        };

        const distance = get_distance_between_points( vertex, vertex_projected_onto_edge );

        if (distance < nearest_edge_distance) {
            nearest_edge = { a: edge_point_a, b: edge_point_b };
            nearest_edge_distance = distance;
        }
    }
    return nearest_edge;
}

export function resolve_collision(globals, point, edge) {
    // Edge points
    let edge_point_a = edge.a;
    let edge_point_b = edge.b;

    // Compute the vector from A to B
    const ab_vector = {
            x: edge_point_b.x - edge_point_a.x,
            y: edge_point_b.y - edge_point_a.y,
    };

    // Compute the vector from A to P
    const ap_vector = {
        x: point.x - edge_point_a.x,
        y: point.y - edge_point_a.y,
    };

    const t = dot(ap_vector, ab_vector) / dot(ab_vector, ab_vector);
    //clamp t between 0 and 1
    const clamped_t = Math.max(0, Math.min(1, t));

    const vertex_projected_onto_edge = {
        x: edge_point_a.x + t * ab_vector.x,
        y: edge_point_a.y + t * ab_vector.y,
    };

    const distance = get_distance_between_points(point, vertex_projected_onto_edge);

    const penetration_vector = {
        x: vertex_projected_onto_edge.x - point.x,
        y: vertex_projected_onto_edge.y - point.y,
    };
    const penetration_vector_normalized = {
        x: penetration_vector.x/distance,
        y: penetration_vector.y/distance,
    };

    // Weighting factor alpha
    const edge_point_a_weight = 1 - clamped_t;
    const edge_point_b_weight = clamped_t;

    const line_end_mass_sum = edge_point_a.mass + edge_point_b.mass;
    const total_mass_sum = point.mass + line_end_mass_sum;

    // Resolve penetration
    const point_movement_factor = line_end_mass_sum / total_mass_sum;
    point.x += penetration_vector.x * point_movement_factor;
    point.y += penetration_vector.y * point_movement_factor;

    const edge_movement_factor = point.mass / total_mass_sum;
    const edge_adjustment_x = penetration_vector.x * edge_movement_factor;
    const edge_adjustment_y = penetration_vector.y * edge_movement_factor;

    edge_point_a.x -= edge_adjustment_x * edge_point_a_weight;
    edge_point_a.y -= edge_adjustment_y * edge_point_a_weight;

    edge_point_b.x -= edge_adjustment_x * edge_point_b_weight;
    edge_point_b.y -= edge_adjustment_y * edge_point_b_weight;


    // Make imaginary point
    const edge_point_a_velocity_x = edge_point_a.x - edge_point_a.prev_x;
    const edge_point_a_velocity_y = edge_point_a.y - edge_point_a.prev_y;


    const edge_point_b_velocity_x = edge_point_b.x - edge_point_b.prev_x;
    const edge_point_b_velocity_y = edge_point_b.y - edge_point_b.prev_y;

    const imaginary_point = {
        x: edge_point_a.x * edge_point_a_weight + edge_point_b.x * edge_point_b_weight,
        y: edge_point_a.y * edge_point_a_weight + edge_point_b.y * edge_point_b_weight,

        vel_x: (edge_point_a_velocity_x + edge_point_b_velocity_x) * .5,
        vel_y: (edge_point_a_velocity_y + edge_point_b_velocity_y) * .5,

        mass: (edge_point_a.mass + edge_point_b.mass),
    };


    const point_vx = point.x - point.prev_x;
    const point_vy = point.y - point.prev_y;

    // Calculate the relative velocity vector
    const relative_velocity_x = point_vx - imaginary_point.vel_x;
    const relative_velocity_y = point_vy - imaginary_point.vel_y;

    const relative_velocity = {
        x: relative_velocity_x,
        y: relative_velocity_y,
    }


    const relative_velocity_dot_penetration_vector_normalized = dot(relative_velocity, penetration_vector_normalized);

    var tangent_to_penetration_vector_normalized = perpendicular(penetration_vector_normalized);
    var friction = .5;
    var relative_velocity_dot_tangent = dot(relative_velocity, tangent_to_penetration_vector_normalized);
    relative_velocity_dot_tangent *= friction;
    var f = relative_velocity_dot_tangent * total_mass_sum;

    // Check if balls are moving towards each other
    // adjust velocity if relative velocity is moving toward each other.
    if (relative_velocity_dot_penetration_vector_normalized <= 0.0001) {
        const point_velocity_x = - (tangent_to_penetration_vector_normalized.x * (f / point.mass));
        const point_velocity_y = - (tangent_to_penetration_vector_normalized.y * (f / point.mass));
        point.prev_x -= point_velocity_x;
        point.prev_y -= point_velocity_y;

        const edge_point_a_velocity_x = - (tangent_to_penetration_vector_normalized.x * (f / line_end_mass_sum) * edge_point_a_weight);
        const edge_point_a_velocity_y = - (tangent_to_penetration_vector_normalized.y * (f / line_end_mass_sum) * edge_point_a_weight);

        edge_point_a.prev_x += edge_point_a_velocity_x;
        edge_point_a.prev_y += edge_point_a_velocity_y;

        const edge_point_b_velocity_x = - (tangent_to_penetration_vector_normalized.x * (f / line_end_mass_sum) * edge_point_b_weight);
        const edge_point_b_velocity_y = - (tangent_to_penetration_vector_normalized.y * (f / line_end_mass_sum) * edge_point_b_weight);
        edge_point_b.prev_x += edge_point_b_velocity_x;
        edge_point_b.prev_y += edge_point_b_velocity_y;
    }
}

export function create_circle_texture(app, radius) {
    const graphics = new Graphics();
    graphics.circle(0, 0, radius);
    graphics.fill(0x000000);
    return app.renderer.generateTexture(graphics);
}

export function get_world_position(viewport, clientX, clientY) {
    const screen_point = new Point(clientX, clientY);
    const world_pos = viewport.toWorld(screen_point);
    
    return world_pos;
}

export function bounding_boxes_intersect(box_a, box_b) {
    // Check for overlap along the x-axis
    if (box_a.right < box_b.left || box_a.left > box_b.right) {
        return false; // No overlap on the x-axis
    }

    // Check for overlap along the y-axis
    if (box_a.bottom < box_b.top || box_a.top > box_b.bottom) {
        return false; // No overlap on the y-axis
    }

    // Overlaps on both axes, therefore the bounding boxes intersect
    return true;
}

function handle_intersection(globals, this_shape, other_shape, intersecting_points, intersecting_edges) {
    //First are going to go through all vertices of this_shape and see if they intersect other_shape
    for (let k = 0; k < this_shape.surface_vertice_holder.length; k++) {
        const vertex = this_shape.surface_vertice_holder[k];
        if (vertex.x < other_shape.bounding_box.right && vertex.x > other_shape.bounding_box.left && vertex.y < other_shape.bounding_box.bottom && vertex.y > other_shape.bounding_box.top) {
            //this_shape's point is inside other_shape's bounding box
            let is_inside = point_in_polygon(vertex, other_shape);

            if (is_inside) {
                this_shape.bounding_box.intersecting = true;
                other_shape.bounding_box.intersecting = true;
                const nearest_edge = closest_edge(globals, vertex, other_shape);

                resolve_collision(globals, vertex, nearest_edge);
                intersecting_points.push(vertex);
                intersecting_edges.push(nearest_edge);

            }
        }
    }
}

export function update_physics(globals, constants, dt) {

    globals.physics_time += dt;

    globals.debug_graphics_layer_1.clear(); // Clear previous debug drawings
    globals.debug_graphics_layer_2.clear(); // Clear previous debug drawings
    globals.debug_graphics_layer_3.clear(); // Clear previous debug drawings

    globals.raycast_line_segments = [];
    globals.edge_normals = [];
    globals.second_pick_edges = [];

    /*
    */
    // Find if a vertex is hovered
    //find_closest_vertex(globals);
    /*
    if (globals.closest_vertex.vertex != null && globals.closest_vertex.distance < globals.drag_snap_distance) {
        globals.closest_vertex.vertex.hovered = true;
        if (globals.drag_mode) {
            if (!globals.actively_dragging) {
                globals.closest_vertex.vertex.grabbed = true;
                globals.actively_dragging = true;
            }
        } else {
            globals.closest_vertex.vertex.grabbed = false;
        }
    }
    */

    for (let shape of globals.shapes_holder) {
        shape.update_vertices(globals, constants, dt);
    }


    if (globals.drag_mode == true && globals.actively_dragging == false) {

        for (let handle of globals.handles_holder) {
            const distance = get_distance_between_points(handle, globals.mouse_world_position)
            if (distance < globals.handle_radius+5) {
                handle.grab(globals);
            }
        }
    }

    if (globals.drag_mode == true && globals.actively_dragging == false) {

        for (let i = 0; i < globals.shapes_holder.length; i++) {
            const shape = globals.shapes_holder[globals.shapes_holder.length-1 - i];
            if ( point_in_polygon(globals.mouse_world_position, shape) ) {
                shape.grab(globals);
            }
        }
    }


    for (let shape of globals.shapes_holder) {
        shape.update_springs(globals, constants);
    }

    for (let shape of globals.shapes_holder) {

        if (shape.uses_frame == true) {
            shape.update_frame_transform(globals);
            shape.update_frame_springs(globals, constants);
        }
    }



    if (globals.drag_mode == true && globals.actively_dragging == true) {
        if (globals.grabbed_shape.is_handle == true) {
            globals.grabbed_shape.y = globals.mouse_world_position.y;
            globals.grabbed_shape.x = globals.mouse_world_position.x;

        } else {
            const combined_vertice_holder = globals.grabbed_shape.surface_vertice_holder.concat(globals.grabbed_shape.inner_vertice_holder);
            for (let i = 0; i < combined_vertice_holder.length; i++) {
                const vertex = combined_vertice_holder[i];
                const vector_to_mouse = globals.grab_vectors_holder[i];
                const grab_strength = globals.grab_weights_holder[i];
                const target_position = {
                    x: globals.mouse_world_position.x + vector_to_mouse.x,
                    y: globals.mouse_world_position.y + vector_to_mouse.y,
                }
                const correction_vector = {
                    x: target_position.x - vertex.x,
                    y: target_position.y - vertex.y,
                }
                vertex.x += (correction_vector.x * grab_strength) ;
                vertex.y += (correction_vector.y * grab_strength) ;
            }
        }
    }

    for (let shape of globals.shapes_holder) {
        shape.update_bounding_box();
        shape.bounding_box.intersecting = false;
        shape.bounding_box.intersecting_shapes_list = [];
    }

    var intersecting_points = [];
    var intersecting_edges = [];

    for (let i = 0; i < globals.shapes_holder.length; i++) {
        var shape_a = globals.shapes_holder[i];
        for (let j = i + 1; j < globals.shapes_holder.length; j++) {
            var shape_b = globals.shapes_holder[j];
            let can_collide = true;
            if ( shape_a.group == "player" && shape_b.group == "player") {
                if (shape_a.type == "ball" && shape_b.type == "ball") {

                } else {
                    can_collide = false;
                }
            }
            if ( shape_a.group == "stage" && shape_b.group == "stage") {
                can_collide = false;
            }

            if ( can_collide && bounding_boxes_intersect(shape_a.bounding_box, shape_b.bounding_box) ) {
                if ( (shape_a.type == "button" && shape_b.type == "ball") || (shape_a.type == "ball" && shape_b.type == "button")) {
                    let button;
                    if (shape_a.type == "button") {
                        button = shape_a;
                    } else if (shape_b.type == "button") {
                        button = shape_b;
                    }
                    button.color = constants.button_pressed_color;
                    globals.unpressed_buttons.delete(button.button_index)
                    if (globals.unpressed_buttons.size == 0 && globals.has_won == false) {
                        //console.log("I have won")
                        globals.ball_launch_multiplier = 4;
                        globals.ball_color = 0xe00000;
                        globals.has_won = true;
                    }
                }

                handle_intersection(globals, shape_a, shape_b, intersecting_points, intersecting_edges);
                handle_intersection(globals, shape_b, shape_a, intersecting_points, intersecting_edges);
            }
        }
    }

    if (globals.car_body) {
        if (globals.tire_1) {
            const car_axel_1_pin = calculate_center(globals.car_axel_1_verts);
            const tire_axel_1_pin = calculate_center(globals.tire_axel_1_verts);

            const delta_x_1 = car_axel_1_pin.x - tire_axel_1_pin.x;
            const delta_y_1 = car_axel_1_pin.y - tire_axel_1_pin.y;

            for (let vert of globals.car_axel_1_verts) {
                vert.x -= delta_x_1*.80;
                vert.y -= delta_y_1*.80;
            }
            for (let vert of globals.tire_1.surface_vertice_holder) {
                vert.x += delta_x_1*.2;
                vert.y += delta_y_1*.2;
            }
        }
        if (globals.tire_2) {
            const car_axel_2_pin = calculate_center(globals.car_axel_2_verts);
            const tire_axel_2_pin = calculate_center(globals.tire_axel_2_verts);

            const delta_x_2 = car_axel_2_pin.x - tire_axel_2_pin.x;
            const delta_y_2 = car_axel_2_pin.y - tire_axel_2_pin.y;

            for (let vert of globals.car_axel_2_verts) {
                vert.x -= delta_x_2*.80;
                vert.y -= delta_y_2*.80;
            }
            for (let vert of globals.tire_2.surface_vertice_holder) {
                vert.x += delta_x_2*.2;
                vert.y += delta_y_2*.2;
            }
        }  
    
        const car_center = calculate_center(globals.car_body.surface_vertice_holder);
        globals.cannon_center = {x: car_center.x, y: car_center.y-200};

        if ( globals.actively_dragging == false) {
            globals.car_body.update_camera_target(globals);
        }
        
    } else if (globals.tire_1 || globals.tire_2) {
        if (globals.actively_dragging == false) {

            if (globals.tire_1) {
                globals.tire_1.update_camera_target(globals);
            } else if (globals.tire_2) {
                globals.tire_2.update_camera_target(globals);
            }
        }
    }
    
    //Test code for accelerator
    for (let accelerator of globals.accelerators_holder) {
        for (let shape of globals.shapes_holder) {
            if ( shape.group != "stage" && shape.group != "stage_accessory") {
                if (bounding_boxes_intersect(accelerator.bounding_box, shape.bounding_box)) {
                    const combined_vertice_holder = shape.surface_vertice_holder.concat(shape.inner_vertice_holder);
                    for (let vertex of combined_vertice_holder) {
                        if (point_in_polygon(vertex, accelerator)) {
                            vertex.extra_vx = accelerator.x_force;
                            vertex.extra_vy = accelerator.y_force;
                        }
                    }
                }
            }
        }
    }
    

    for (let shape of globals.shapes_holder) {
        shape.clear_touching();
    }
    //draw_debug_points(globals, intersecting_points, intersecting_edges, globals.raycast_line_segments);
}


export function make_spring(vertex_1, vertex_2) {
  var spring = {
    vertex_1: vertex_1,
    vertex_2: vertex_2,
    length: Math.sqrt(
      (vertex_2.x - vertex_1.x) ** 2 + (vertex_2.y - vertex_1.y) ** 2,
    ),
  };
  return spring;
}

export function make_frame_spring(frame_vertex, surface_vertex) {
  var spring = {
    frame_vertex: frame_vertex,
    surface_vertex: surface_vertex,
  };
  return spring;
}

export function make_vertice(x, y) {
  var vertex = {
    x: x,
    y: y,
    prev_x: x,
    prev_y: y,
    grabbed: false,
    hovered: false,
    touching: false,
    mass: 1,
    corner: false,
    extra_vx: 0,
    extra_vy: 0,
  };

  return vertex;
}

export function make_particle(globals, x, y) {
  const particle = new Sprite(globals.circle_texture);
  particle.anchor.set(0.5);
  particle.position.set(x, y);

  return particle;
}

export function make_frame_vertice(globals, x, y) {
  var frame_vertex = {
    x: x,
    y: y,
    offset_x: 0,
    offset_y: 0,
  };

  return frame_vertex;
}

export function launch_ball(globals) {
    const ball = make_cannon_ball(globals);
    ball.group = "player"
    ball.type = "ball"
    ball.floor_friction = .2;
    ball.DAMPING = .8;  
    ball.color = globals.ball_color;

    const combined_vertice_holder = ball.surface_vertice_holder.concat(ball.inner_vertice_holder);
    for (let i = 0; i < combined_vertice_holder.length; i++) {
        const vertex = combined_vertice_holder[i];
        vertex.x += globals.cannon_center.x;
        vertex.y += globals.cannon_center.y;
        vertex.prev_x += globals.cannon_center.x - globals.launch_direction.x*globals.ball_launch_multiplier;
        vertex.prev_y += globals.cannon_center.y - globals.launch_direction.y*globals.ball_launch_multiplier ;
    }

    globals.shake_intensity = 30;
    globals.shake_until = Date.now() + 100;

    globals.cannon_animate_until = Date.now() + globals.cannon_animate_duration;

    globals.queued_fire = false;
}

function draw_debug_points(globals, points, edges, raycast_line_segments) {
    globals.debug_graphics_layer_3.beginFill(0xff0000); // Red color

    points.forEach((point) => {
        globals.debug_graphics_layer_3.drawCircle(point.x, point.y, 5);
    });

    globals.debug_graphics_layer_3.endFill();

    globals.debug_graphics_layer_3.beginPath();
    globals.debug_graphics_layer_3.lineStyle(3, 0x00ff00);

    edges.forEach((edge) => {
        globals.debug_graphics_layer_3.moveTo(edge.a.x, edge.a.y);
        globals.debug_graphics_layer_3.lineTo(edge.b.x, edge.b.y);
    });

    globals.debug_graphics_layer_3.stroke();

    globals.debug_graphics_layer_1.beginPath();
    globals.debug_graphics_layer_1.lineStyle(6, 0xff00ff);

    globals.second_pick_edges.forEach((edge) => {
        globals.debug_graphics_layer_1.moveTo(edge.a.x, edge.a.y);
        globals.debug_graphics_layer_1.lineTo(edge.b.x, edge.b.y);
    });

    globals.debug_graphics_layer_1.stroke();

    globals.debug_graphics_layer_2.beginFill(0x0000ff); // Purple color

    raycast_line_segments.forEach((segment) => {
        const point_1 = segment[0];
        const point_2 = segment[1];

        globals.debug_graphics_layer_2.moveTo(point_1.x, point_1.y);
        globals.debug_graphics_layer_2.lineTo(point_2.x, point_2.y);
    });

    //globals.debug_graphics_layer_2.endFill();

    globals.edge_normals.forEach((normal_packet) => {
        const midpoint = normal_packet[0];
        const normal = normal_packet[1];
        const normal_endpoint = {
        x: midpoint.x + 20 * normal.x,
        y: midpoint.y + 20 * normal.y,
        };

        globals.debug_graphics_layer_2.moveTo(midpoint.x, midpoint.y);
        globals.debug_graphics_layer_2.lineTo(normal_endpoint.x, normal_endpoint.y);
    });

    globals.debug_graphics_layer_2.endFill();
}

export function clear_shapes(globals) {
    const backup_shape_holder = [...globals.shapes_holder];
    for (let i = 0; i < backup_shape_holder.length; i++) {
        const shape = backup_shape_holder[i];
        if (shape.group != "stage" && shape.group != "stage_accessory") {
            if (shape.group != "player" || shape.type == "ball") {
                shape.delete(globals);
            }
        }
    }

    const backup_handles_holder = [...globals.handles_holder];
    for (let i = 0; i < backup_handles_holder.length; i++) {
        const handle = backup_handles_holder[i];
        handle.delete(globals);
    }
}

export function set_shape_position(globals, shape, set_prev_position, target_upper_left) {
    const shape_upper_left = {
        x: shape.bounding_box.left,
        y: shape.bounding_box.top,
    };
    const amount_to_displace = {
        x: target_upper_left.x - shape_upper_left.x,
        y: target_upper_left.y - shape_upper_left.y,
    }

    const combined_vertice_holder = shape.surface_vertice_holder.concat(shape.inner_vertice_holder);

    for (let vertex of combined_vertice_holder) {
        vertex.x += amount_to_displace.x;
        vertex.y += amount_to_displace.y;

        if (set_prev_position) {
            vertex.prev_x += amount_to_displace.x;
            vertex.prev_y += amount_to_displace.y;
        }
    }

    for (let frame_data_pack of shape.frame_collection) {
        const frame_verts = frame_data_pack.vertex_arrays.frame_vertices;

        for (let frame_vertex of frame_verts) {
            frame_vertex.x += amount_to_displace.x;
            frame_vertex.y += amount_to_displace.y;
        }
    }
    if (shape.left_handle) {
        shape.left_handle.update();
    }
    if (shape.right_handle) {
        shape.right_handle.update();
    }
}

export function generate_frame_segements_for_rectangles(length, height, segment_width, default_fixed) {

    const frame_indices_segment_collection = [];
    const total_edge_verts = (length+1)*2 + (height-1)*2 + 4;
    const segments = length-1;

    
    const front_cap = [];
    for (let j = 0; j < segment_width+1; j++) {
        const reverse_index = segment_width - j;
        front_cap.push(total_edge_verts-1-(height-1)-reverse_index);
    }
    for (let j = 0; j < height-1; j++) {
        const reverse_index = (height-1) - j;
        front_cap.push(total_edge_verts-reverse_index);
    }
    for (let j = 0; j < segment_width+1; j++) {
        front_cap.push(j);
    }
    frame_indices_segment_collection.push(front_cap);


    let top_starting_index = total_edge_verts - 1 - (height-1) - 2;
    let bottom_starting_index = 2;

    for (let i = 0; i < segments-2; i++) {
        const frame = [];
        
        for (let j = segment_width-1; j >= 0; j--) {
            frame.push(top_starting_index-j);
        }

        for (let j = 0; j < segment_width; j++) {
            frame.push(bottom_starting_index+j);

        }
        top_starting_index -= 1;
        bottom_starting_index += 1;
        frame_indices_segment_collection.push(frame);
    }

    const back_cap_start_index = length+2 - segment_width;
    const back_cap = [];
    for (let j = 0; j < segment_width+1; j++) {
        const reverse_index = back_cap_start_index + (segment_width+1)+(height-1) + j;
        back_cap.push(back_cap_start_index + (segment_width+1)+(height-1) + j);
    }
    for (let j = 0; j < (segment_width+1)+(height-1); j++) {
        back_cap.push(back_cap_start_index+j);
    }
    frame_indices_segment_collection.push(back_cap);

    const is_frame_fixed_collection = [];
    for (let i = 0; i < segments; i++) {
        is_frame_fixed_collection.push(default_fixed)
    }

    return [frame_indices_segment_collection, is_frame_fixed_collection]
}

export async function load_shape_data_from_file(file) {
    try {
        const text = await file.text();
        
        // Extract arrays using more robust regex
        function extractArray(text, arrayName) {
            const regex = new RegExp(`"${arrayName}"\\s*:\\s*\\[(.*?)\\]`, 's');
            const match = text.match(regex);
            if (!match) throw new Error(`Could not find ${arrayName} in file`);
            return match[1];
        }

        // Parse inner points
        const innerPointsText = extractArray(text, 'inner_points');
        const inner_points = innerPointsText
            .split('{')
            .filter(p => p.includes('x'))
            .map(point => {
                const x = point.match(/x"?\s*:\s*([-\d.]+)/);
                const y = point.match(/y"?\s*:\s*([-\d.]+)/);
                return {
                    x: parseFloat(x[1]),
                    y: parseFloat(y[1])
                };
            });

        // Parse surface points
        const surfacePointsText = extractArray(text, 'surface_points');
        const surface_points = surfacePointsText
            .split('{')
            .filter(p => p.includes('x'))
            .map(point => {
                const x = point.match(/x"?\s*:\s*([-\d.]+)/);
                const y = point.match(/y"?\s*:\s*([-\d.]+)/);
                return {
                    x: parseFloat(x[1]),
                    y: parseFloat(y[1])
                };
            });

        // Parse springs using a more robust approach
        const springsText = extractArray(text, 'springs');
        const springs = [];
        const springMatches = springsText.matchAll(/{\s*"a"[^}]+},\s*"b"[^}]+}/g);
        
        for (const match of springMatches) {
            const springText = match[0];
            
            // Extract a and b properties
            const aMatch = springText.match(/"a"[^{]*{\s*"spring_list":\s*"(\w+)",\s*"index":\s*(\d+)/);
            const bMatch = springText.match(/"b"[^{]*{\s*"spring_list":\s*"(\w+)",\s*"index":\s*(\d+)/);
            
            if (aMatch && bMatch) {
                springs.push({
                    a: {
                        spring_list: aMatch[1],
                        index: parseInt(aMatch[2])
                    },
                    b: {
                        spring_list: bMatch[1],
                        index: parseInt(bMatch[2])
                    }
                });
            }
        }

        return { inner_points, surface_points, springs };
    } catch (error) {
        console.error('Error loading shape:', error);
        throw error;
    }
}