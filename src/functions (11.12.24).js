import { Container, Graphics, Sprite } from "pixi.js";
import { Constants, Elements, Globals, Shape } from "./classes.js";

export function mod(n, m) {
  return ((n % m) + m) % m;
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
  //globals.loading_fps_counter
}

export function draw_graphics(globals) {
  globals.all_lines_graphics.clear();
  globals.polygon_graphics.clear();
  globals.bounding_box_graphics.clear();

  for (let shape of globals.shapes_holder) {
    let color_to_use = shape.bounding_box.intersecting ? 0xffff00 : shape.color;

    globals.polygon_graphics.beginFill(color_to_use);
    globals.polygon_graphics.lineStyle(1, 0xff0000);
    var adjusted_vertices = [];
    for (let vertex of shape.surface_vertice_holder) {
      const adjusted_vertex = {
        x: vertex.x * globals.render_scale,
        y: vertex.y * globals.render_scale,
      };
      adjusted_vertices.push(adjusted_vertex);
    }
    globals.polygon_graphics.drawPolygon(adjusted_vertices);
    globals.polygon_graphics.endFill();

    globals.all_lines_graphics.beginPath();

    for (let spring of shape.spring_holder) {
      const vertex_1 = spring.vertex_1;
      const vertex_2 = spring.vertex_2;

      globals.all_lines_graphics.moveTo(
        vertex_1.x * globals.render_scale,
        vertex_1.y * globals.render_scale,
      );
      globals.all_lines_graphics.lineTo(
        vertex_2.x * globals.render_scale,
        vertex_2.y * globals.render_scale,
      );
    }

    if (false) {
      for (let i = 0; i < shape.frame_vertice_holder.length; i++) {
        var current_frame_vertex = shape.frame_vertice_holder[i];
        let prev_frame_vertex_index = i - 1;
        if (prev_frame_vertex_index < 0) {
          prev_frame_vertex_index = shape.frame_vertice_holder.length - 1;
        }
        var prev_frame_vertex =
          shape.frame_vertice_holder[prev_frame_vertex_index];

        globals.all_lines_graphics.moveTo(
          prev_frame_vertex.x * globals.render_scale,
          prev_frame_vertex.y * globals.render_scale,
        );
        globals.all_lines_graphics.lineTo(
          current_frame_vertex.x * globals.render_scale,
          current_frame_vertex.y * globals.render_scale,
        );
      }

      for (let frame_spring of shape.frame_spring_holder) {
        const frame_vertex = frame_spring.frame_vertex;
        const surface_vertex = frame_spring.surface_vertex;

        globals.all_lines_graphics.moveTo(
          frame_vertex.x * globals.render_scale,
          frame_vertex.y * globals.render_scale,
        );
        globals.all_lines_graphics.lineTo(
          surface_vertex.x * globals.render_scale,
          surface_vertex.y * globals.render_scale,
        );
      }
    }

    globals.all_lines_graphics.stroke();
    
    /*
    globals.bounding_box_graphics.beginPath();
    const padding = 0;

    const left = shape.bounding_box.left * globals.render_scale - padding;
    const right = shape.bounding_box.right * globals.render_scale + padding;
    const top = shape.bounding_box.top * globals.render_scale - padding;
    const bottom = shape.bounding_box.bottom * globals.render_scale + padding;

    globals.bounding_box_graphics.moveTo(left, top);
    globals.bounding_box_graphics.lineTo(right, top);

    globals.bounding_box_graphics.moveTo(right, top);
    globals.bounding_box_graphics.lineTo(right, bottom);

    globals.bounding_box_graphics.moveTo(right, bottom);
    globals.bounding_box_graphics.lineTo(left, bottom);

    globals.bounding_box_graphics.moveTo(left, bottom);
    globals.bounding_box_graphics.lineTo(left, top);

    globals.bounding_box_graphics.stroke();
    */
  }

  for (let shape of globals.shapes_holder) {
    shape.update_particles(globals);
  }
}

export function hide_element(element) {
  element.classList.add("hidden");
}

export function show_element(element) {
  element.classList.remove("hidden");
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



export function closest_edge_testing(globals, vertex, shape) {
    let nearest_edge = null;
    let nearest_normal = null;
    let vertex_direction_normal_dot_product = 0;
    let close_candidates = [];
    let nearest_edge_distance = 99999999999999;

    const intersecting_edges = [];

    const direction_vector_distance = get_distance_between_points(vertex, {
        x: vertex.prev_x,
        y: vertex.prev_y,
    });
    const direction_vector = {
        x: (vertex.x - vertex.prev_x) / direction_vector_distance,
        y: (vertex.y - vertex.prev_y) / direction_vector_distance,
    };

    const exageration_scale = 20;
    const prev_pos_x = vertex.prev_x - vertex.x
    const prev_pos_y = vertex.prev_y - vertex.y
    const prev_pos_length = Math.sqrt(prev_pos_x**2 + prev_pos_y**2)
    const prev_pos_x_normalized = prev_pos_x/prev_pos_length;
    const prev_pos_y_normalized = prev_pos_y/prev_pos_length;

    const exagerated_prev_pos_vertex = {
        x: vertex.prev_x + prev_pos_x_normalized * exageration_scale,
        y: vertex.prev_y + prev_pos_y_normalized * exageration_scale,
    };

    const exagerated_vertex = {
        x: vertex.x - prev_pos_x_normalized * exageration_scale,
        y: vertex.y - prev_pos_y_normalized * exageration_scale,
    };

    const n_vertices = shape.surface_vertice_holder.length;
    // Loop through each edge of the polygon
    for (let i = 0; i < n_vertices; i++) {
        const edge_point_a = shape.surface_vertice_holder[i];
        const edge_point_b = shape.surface_vertice_holder[(i + 1) % n_vertices];

        const edge_change_in_x = edge_point_a.x - edge_point_b.x;
        const edge_change_in_y = edge_point_a.y - edge_point_b.y;
        const edge_distance = get_distance_between_points( edge_point_a, edge_point_b );
        const edge_normal = {
            x: -edge_change_in_y / edge_distance,
            y: edge_change_in_x / edge_distance,
        };

        const edge_centerpoint = {
            x: (edge_point_a.x + edge_point_b.x) / 2,
            y: (edge_point_a.y + edge_point_b.y) / 2,
        };

        globals.edge_normals.push([edge_centerpoint, edge_normal]);

        // Return true if line segments AB and CD intersect
        //intersect(vertex,exagerated_prev_pos_vertex,edge_point_a,edge_point_b)
        globals.raycast_line_segments.push([exagerated_vertex, exagerated_prev_pos_vertex]);
        //console.log("vertex:", vertex)
        //console.log("exagerated_prev_pos_vertex:", exagerated_prev_pos_vertex)

        //const test_intersection = intersection_point( {x:0, y:0}, {x:2, y:2}, {x:0, y:2}, {x:2, y:0} )
        //console.log("test_intersection:", test_intersection)

        const intersection = intersection_point(exagerated_vertex,exagerated_prev_pos_vertex, edge_point_a,edge_point_b)
        console.log("intersection:", intersection);
        
        if ( intersection != null) {
            //const intersection_point = get_distance_between_points(vertex, intersection)
            const distance = get_distance_between_points(vertex, intersection);
            if (distance < nearest_edge_distance) {
                nearest_edge = {a: edge_point_a, b: edge_point_b}
                nearest_edge_distance = distance;
            }
        }
    }

    if (nearest_edge != null) {
        console.log("nearest_edge:", nearest_edge);
        return nearest_edge
    }

    for (let i = 0; i < n_vertices; i++) {
        //const edge_point_a = shape.surface_vertice_holder[i];
        //const edge_point_b = shape.surface_vertice_holder[(i + 1) % n_vertices];

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

        const distance = get_distance_between_points(
        vertex,
        vertex_projected_onto_edge,
        );

        if (distance < nearest_edge_distance) {
            nearest_edge = { a: edge_point_a, b: edge_point_b };
            nearest_edge_distance = distance;
        }
    }
    return nearest_edge;
}

export function closest_edge_with_depth(globals, vertex, shape) {
  let nearest_edge = null;
  let nearest_edge_distance = 99999999999999;

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

    const distance = get_distance_between_points(
      vertex,
      vertex_projected_onto_edge,
    );

    if (distance < nearest_edge_distance) {
      nearest_edge = { a: edge_point_a, b: edge_point_b };
      nearest_edge_distance = distance;
    }
  }
  return [nearest_edge, nearest_edge_distance];
}

function distance_to_edge(globals, vertex, edge) {
// Compute the vector from A to B
const ab_vector = {
    x: edge.b.x - edge.a.x,
    y: edge.b.y - edge.a.y,
  };

  // Compute the vector from A to P
  const ap_vector = {
    x: vertex.x - edge.a.x,
    y: vertex.y - edge.a.y,
  };

  const t = dot(ap_vector, ab_vector) / dot(ab_vector, ab_vector);
  const clamped_t = Math.min(1, Math.max(0, t));

  const vertex_projected_onto_edge = {
    x: edge.a.x + clamped_t * ab_vector.x,
    y: edge.a.y + clamped_t * ab_vector.y,
  };

  const distance = get_distance_between_points(vertex, vertex_projected_onto_edge);
  return distance;

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
  
      const distance = get_distance_between_points(
        vertex,
        vertex_projected_onto_edge,
      );
  
      if (distance < nearest_edge_distance) {
  
        nearest_edge = { a: edge_point_a, b: edge_point_b };
        nearest_edge_distance = distance;
  
      }
    }
    return nearest_edge;
  }

export function top_two_closest_edges(globals, vertex, shape) {
  let nearest_edge = null;
  let second_nearest_edge = null;
  let nearest_edge_distance = Infinity;
  let second_nearest_edge_distance = Infinity;

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

    const distance = get_distance_between_points(
      vertex,
      vertex_projected_onto_edge,
    );

    if (distance < nearest_edge_distance) {
      second_nearest_edge = nearest_edge;
      second_nearest_edge_distance = nearest_edge_distance;

      nearest_edge = { a: edge_point_a, b: edge_point_b };
      nearest_edge_distance = distance;

    } else if (distance < second_nearest_edge_distance) {
      second_nearest_edge = { a: edge_point_a, b: edge_point_b };
      second_nearest_edge_distance = distance;
    }
  }
  return [nearest_edge, second_nearest_edge];
}

export function edges_sorted_by_proximity(globals, vertex, shape) {
  const edges = [];
  const n_vertices = shape.surface_vertice_holder.length;
  // Loop through each edge of the polygon
  for (let i = 0; i < n_vertices; i++) {
    const edge_point_a = shape.surface_vertice_holder[i];
    const edge_point_b = shape.surface_vertice_holder[(i + 1) % n_vertices];

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

    const distance = get_distance_between_points(
      vertex,
      vertex_projected_onto_edge,
    );
    edges.push([distance, { a: edge_point_a, b: edge_point_b }]);
  }
  edges.sort((a, b) => a[0] - b[0]);
  return edges;
}

function dot(vector_a, vector_b) {
  return vector_a.x * vector_b.x + vector_a.y * vector_b.y;
}

function perpendicular(vector) {
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
    //var j = -1 * relative_velocity_dot_penetration_vector_normalized * total_mass_sum;

    //const elasticity = 0;
    //var j = -(elasticity) * relative_velocity_dot_penetration_vector_normalized * total_mass_sum;

    var tangent_to_penetration_vector_normalized = perpendicular(penetration_vector_normalized);
    //var friction = .5;
    var friction = .5;
    var relative_velocity_dot_tangent = dot(relative_velocity, tangent_to_penetration_vector_normalized);
    relative_velocity_dot_tangent *= friction;
    var f = relative_velocity_dot_tangent * total_mass_sum;

    // Check if balls are moving towards each other
    // adjust velocity if relative velocity is moving toward each other.
    if (relative_velocity_dot_penetration_vector_normalized <= 0.0001) {
        //const point_velocity_x = (penetration_vector_normalized.x * (j / point.mass)) - (tangent_to_penetration_vector_normalized.x * (f / point.mass));
        //const point_velocity_y = (penetration_vector_normalized.y * (j / point.mass)) - (tangent_to_penetration_vector_normalized.y * (f / point.mass));
        const point_velocity_x = - (tangent_to_penetration_vector_normalized.x * (f / point.mass));
        const point_velocity_y = - (tangent_to_penetration_vector_normalized.y * (f / point.mass));
        point.prev_x -= point_velocity_x;
        point.prev_y -= point_velocity_y;

        //const edge_point_a_velocity_x = (penetration_vector_normalized.x * (j / line_end_mass_sum) * edge_point_a_weight) - (tangent_to_penetration_vector_normalized.x * (f / line_end_mass_sum) * edge_point_a_weight);
        //const edge_point_a_velocity_y = (penetration_vector_normalized.y * (j / line_end_mass_sum) * edge_point_a_weight) - (tangent_to_penetration_vector_normalized.y * (f / line_end_mass_sum) * edge_point_a_weight);
        const edge_point_a_velocity_x = - (tangent_to_penetration_vector_normalized.x * (f / line_end_mass_sum) * edge_point_a_weight);
        const edge_point_a_velocity_y = - (tangent_to_penetration_vector_normalized.y * (f / line_end_mass_sum) * edge_point_a_weight);

        edge_point_a.prev_x += edge_point_a_velocity_x;
        edge_point_a.prev_y += edge_point_a_velocity_y;

        //const edge_point_b_velocity_x = (penetration_vector_normalized.x * (j / line_end_mass_sum) * edge_point_b_weight) - (tangent_to_penetration_vector_normalized.x * (f / line_end_mass_sum) * edge_point_b_weight);
        //const edge_point_b_velocity_y = (penetration_vector_normalized.y * (j / line_end_mass_sum) * edge_point_b_weight) - (tangent_to_penetration_vector_normalized.y * (f / line_end_mass_sum) * edge_point_b_weight);
        const edge_point_b_velocity_x = - (tangent_to_penetration_vector_normalized.x * (f / line_end_mass_sum) * edge_point_b_weight);
        const edge_point_b_velocity_y = - (tangent_to_penetration_vector_normalized.y * (f / line_end_mass_sum) * edge_point_b_weight);
        edge_point_b.prev_x += edge_point_b_velocity_x;
        edge_point_b.prev_y += edge_point_b_velocity_y;
    }
}

export function createCircleTexture(app, radius) {
    const graphics = new Graphics();
    graphics.circle(0, 0, radius);
    graphics.fill(0x000000);
    return app.renderer.generateTexture(graphics);
}

export function set_render_offsets_and_scale(globals) {
    if (window.innerWidth < 1040) {
        globals.render_scale = (window.innerWidth - 40) / 1000;
    } else {
        globals.render_scale = 1;
    }
}

function ccw(A, B, C) {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
}

// Return true if line segments AB and CD intersect
export function intersect(A, B, C, D) {
    return ccw(A, C, D) != ccw(B, C, D) && ccw(A, B, C) != ccw(A, B, D);
}



function intersection_point(A, B, C, D) {
    // Check if lines are parallel
    const denominator = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);
    if (denominator === 0) {
        return null; // Lines are parallel
    }

    // Calculate intersection point
    const ua =    ((D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x)) / denominator;
    const ub =    ((B.x - A.x) * (A.y - C.y) - (B.y - A.y) * (A.x - C.x)) / denominator;

    // Check if intersection point is within both line segments
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        return {
            x: A.x + ua * (B.x - A.x),
            y: A.y + ua * (B.y - A.y),
        };
    }

    return null; // Lines don't intersect within the segments
}

export function find_closest_vertex(globals) {
    var shortest_distance = 9999999999999;
    globals.closest_vertex = { vertex: null, distance: null };
    for (let shape of globals.shapes_holder) {
        for (let vertex of shape.surface_vertice_holder.concat( ape.inner_vertice_holder )) {
            const distance_to_mouse_x = globals.mouse_position.x / globals.render_scale - vertex.x;
            const distance_to_mouse_y = globals.mouse_position.y / globals.render_scale - vertex.y;
            const distance_to_mouse_squared = distance_to_mouse_x ** 2 + distance_to_mouse_y ** 2;
            if (distance_to_mouse_squared < shortest_distance) {
                shortest_distance = distance_to_mouse_squared;
                globals.closest_vertex = {
                    vertex: vertex,
                    distance: Math.sqrt(distance_to_mouse_squared),
                };
            }
            vertex.hovered = false;
        }
    }
}

function get_world_position(viewport, clientX, clientY) {
    // Get the viewport's canvas/renderer element
    const canvas = viewport.renderer.view;
    
    // Get canvas-relative coordinates
    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    
    // Create a PIXI Point with the screen coordinates
    const screenPoint = new PIXI.Point(screenX, screenY);
    
    // Convert screen coordinates to world coordinates
    // This accounts for viewport position, scale, and rotation
    const worldPos = viewport.toWorld(screenPoint);
    
    return worldPos;
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

function common_element(arr1, arr2) {
    //returns the first one it finds, meant for cases where you know there's just one
    for (let element of arr1) {
      if (arr2.includes(element)) {
        return element;
      }
    }
    return null;
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
        if (globals.drag_mode == true && globals.actively_dragging == false) {
            //console.log("search for hovered shapes");
            if ( point_in_polygon(globals.mouse_position, shape) ) {
                shape.grab(globals);
            }
        }
    }
    for (let shape of globals.shapes_holder) {
        //shape.update_springs(globals, constants);
        shape.update_springs_and_inflation(globals, constants);
    }

    for (let shape of globals.shapes_holder) {

        if (shape.uses_frame == true) {
            shape.update_frame_transform(globals);
            shape.update_frame_springs(globals, constants);
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
            if ( bounding_boxes_intersect(shape_a.bounding_box, shape_b.bounding_box) ) {
                handle_intersection(globals, shape_a, shape_b, intersecting_points, intersecting_edges);
                handle_intersection(globals, shape_b, shape_a, intersecting_points, intersecting_edges);
            }
        }
    }

    for (let shape of globals.shapes_holder) {
        shape.clear_touching();

        if ( shape.group == "player" ) {
            //shape.rotate_left(globals, constants);
        }
    }
    //draw_debug_points(globals, intersecting_points, intersecting_edges, globals.raycast_line_segments);
}

export function make_4x4_square(globals, uses_frame, uses_inflation) {
    var surface_vertice_list = [];
    var inner_vertice_list = [];

    var frame_vertice_list = [];
    var frame_spring_list = [];

    var spring_list = [];

    let scale = 100;
    scale = 100;

    var inner_point_list = [
        {	x: 1,		 y: 1		},
        {	x: 1,		 y: 1.5		},
        {	x: 1,		 y: 0.5		},
        {	x: 0.5,		 y: 1		},
        {	x: 0.5,		 y: 1.5		},
        {	x: 0.5,		 y: 0.5		},
        {	x: 1.5,		 y: 1		},
        {	x: 1.5,		 y: 1.5		},
        {	x: 1.5,		 y: 0.5		},
    ]
    var inner_vertice_list = []
    for (let point of inner_point_list) {
        let vertex = make_vertice(point.x * scale, point.y * scale);
        inner_vertice_list.push(vertex)
    }

    var surface_point_list = [
        {	x: 0,		 y: 0.125	},
        {	x: 0.125,	 y: 0		},
        {	x: 0.5,		 y: 0		},
        {	x: 1,		 y: 0		},
        {	x: 1.5,		 y: 0		},
        {	x: 1.875,	 y: 0		},
        {	x: 2,		 y: 0.125	},
        {	x: 2,		 y: 0.5		},
        {	x: 2,		 y: 1		},
        {	x: 2,		 y: 1.5		},
        {	x: 2,		 y: 1.875	},
        {	x: 1.875,	 y: 2		},
        {	x: 1.5,		 y: 2		},
        {	x: 1,		 y: 2		},
        {	x: 0.5,		 y: 2		},
        {	x: 0.125,	 y: 2		},
        {	x: 0,		 y: 1.875	},
        {	x: 0,		 y: 1.5		},
        {	x: 0,		 y: 1		},
        {	x: 0,		 y: 0.5		},
    ]
    var surface_vertex_list = []
    for (let point of surface_point_list) {
        let vertex = make_vertice(point.x * scale, point.y * scale);
        surface_vertex_list.push(vertex)
    }

    for (let i = 0; i < surface_vertex_list.length; i++) {
        const vertex = surface_vertex_list[i]
        const prev_vertex = surface_vertex_list[mod(i-1, surface_vertex_list.length)]
        surface_vertice_list.push(vertex);
        var spring = make_spring(vertex, prev_vertex);
        spring_list.push(spring);
    }


    const temp_spring_list = [
        make_spring(surface_vertice_list[17], surface_vertice_list[18]),
        make_spring(surface_vertice_list[7], surface_vertice_list[8]),
        make_spring(surface_vertice_list[2], surface_vertice_list[3]),
        make_spring(surface_vertice_list[12], surface_vertice_list[13]),
        make_spring(surface_vertice_list[8], surface_vertice_list[9]),
        make_spring(surface_vertice_list[18], surface_vertice_list[19]),
        make_spring(surface_vertice_list[13], surface_vertice_list[14]),
        make_spring(surface_vertice_list[3], surface_vertice_list[4]),
        make_spring(surface_vertice_list[19], surface_vertice_list[0]),
        make_spring(surface_vertice_list[0], surface_vertice_list[1]),
        make_spring(surface_vertice_list[1], surface_vertice_list[2]),
        make_spring(surface_vertice_list[4], surface_vertice_list[5]),
        make_spring(surface_vertice_list[5], surface_vertice_list[6]),
        make_spring(surface_vertice_list[6], surface_vertice_list[7]),
        make_spring(surface_vertice_list[16], surface_vertice_list[17]),
        make_spring(surface_vertice_list[14], surface_vertice_list[15]),
        make_spring(surface_vertice_list[15], surface_vertice_list[16]),
        make_spring(surface_vertice_list[9], surface_vertice_list[10]),
        make_spring(surface_vertice_list[10], surface_vertice_list[11]),
        make_spring(surface_vertice_list[11], surface_vertice_list[12]),
        make_spring(inner_vertice_list[6], inner_vertice_list[0]),
        make_spring(inner_vertice_list[2], inner_vertice_list[0]),
        make_spring(inner_vertice_list[0], inner_vertice_list[1]),
        make_spring(inner_vertice_list[7], inner_vertice_list[1]),
        make_spring(inner_vertice_list[8], inner_vertice_list[2]),
        make_spring(inner_vertice_list[0], inner_vertice_list[3]),
        make_spring(inner_vertice_list[1], inner_vertice_list[4]),
        make_spring(inner_vertice_list[2], inner_vertice_list[5]),
        make_spring(inner_vertice_list[3], inner_vertice_list[4]),
        make_spring(inner_vertice_list[5], inner_vertice_list[3]),
        make_spring(inner_vertice_list[6], inner_vertice_list[7]),
        make_spring(inner_vertice_list[8], inner_vertice_list[6]),
        make_spring(surface_vertice_list[13], inner_vertice_list[1]),
        make_spring(surface_vertice_list[14], inner_vertice_list[4]),
        make_spring(surface_vertice_list[12], inner_vertice_list[7]),
        make_spring(surface_vertice_list[8], inner_vertice_list[6]),
        make_spring(surface_vertice_list[9], inner_vertice_list[7]),
        make_spring(surface_vertice_list[11], inner_vertice_list[7]),
        make_spring(surface_vertice_list[10], inner_vertice_list[7]),
        make_spring(surface_vertice_list[7], inner_vertice_list[8]),
        make_spring(surface_vertice_list[6], inner_vertice_list[8]),
        make_spring(surface_vertice_list[3], inner_vertice_list[2]),
        make_spring(surface_vertice_list[4], inner_vertice_list[8]),
        make_spring(surface_vertice_list[2], inner_vertice_list[5]),
        make_spring(surface_vertice_list[18], inner_vertice_list[3]),
        make_spring(surface_vertice_list[19], inner_vertice_list[5]),
        make_spring(surface_vertice_list[17], inner_vertice_list[4]),
        make_spring(surface_vertice_list[15], inner_vertice_list[4]),
        make_spring(surface_vertice_list[16], inner_vertice_list[4]),
        make_spring(surface_vertice_list[0], inner_vertice_list[5]),
        make_spring(surface_vertice_list[1], inner_vertice_list[5]),
        make_spring(surface_vertice_list[5], inner_vertice_list[8]),
        make_spring(surface_vertice_list[17], surface_vertice_list[14]),
        make_spring(surface_vertice_list[19], surface_vertice_list[2]),
        make_spring(surface_vertice_list[7], surface_vertice_list[4]),
        make_spring(surface_vertice_list[9], surface_vertice_list[12]),
        make_spring(surface_vertice_list[14], inner_vertice_list[1]),
        make_spring(surface_vertice_list[13], inner_vertice_list[7]),
        make_spring(surface_vertice_list[12], inner_vertice_list[1]),
        make_spring(surface_vertice_list[13], inner_vertice_list[4]),
        make_spring(surface_vertice_list[18], inner_vertice_list[4]),
        make_spring(surface_vertice_list[17], inner_vertice_list[3]),
        make_spring(surface_vertice_list[18], inner_vertice_list[5]),
        make_spring(inner_vertice_list[2], inner_vertice_list[3]),
        make_spring(inner_vertice_list[0], inner_vertice_list[4]),
        make_spring(inner_vertice_list[1], inner_vertice_list[6]),
        make_spring(surface_vertice_list[8], inner_vertice_list[7]),
        make_spring(inner_vertice_list[2], inner_vertice_list[6]),
        make_spring(surface_vertice_list[3], inner_vertice_list[8]),
        make_spring(surface_vertice_list[8], inner_vertice_list[8]),
        make_spring(surface_vertice_list[2], inner_vertice_list[2]),
        make_spring(surface_vertice_list[3], inner_vertice_list[5]),
        make_spring(surface_vertice_list[4], inner_vertice_list[2]),
        make_spring(inner_vertice_list[0], inner_vertice_list[8]),
        make_spring(surface_vertice_list[7], inner_vertice_list[6]),
        make_spring(surface_vertice_list[9], inner_vertice_list[6]),
        make_spring(inner_vertice_list[1], inner_vertice_list[3]),
        make_spring(inner_vertice_list[0], inner_vertice_list[5]),
        make_spring(surface_vertice_list[19], inner_vertice_list[3]),
        make_spring(inner_vertice_list[0], inner_vertice_list[7]),
    ]
    spring_list.push(...temp_spring_list);

    var shape = new Shape();
    shape.surface_vertice_holder = surface_vertice_list;
    shape.inner_vertice_holder = inner_vertice_list;
    shape.frame_vertice_holder = frame_vertice_list;
    shape.spring_holder = spring_list;
    shape.frame_spring_holder = frame_spring_list;
    shape.uses_frame = uses_frame;
    shape.uses_inflation = uses_inflation;

    globals.shapes_holder.push(shape);

    //For every surface vertex I want to make a frame vertex
    for (let surface_vertex of surface_vertice_list) {
        let frame_vertex = make_frame_vertice(
            globals,
            surface_vertex.x,
            surface_vertex.y,
        );
        frame_vertice_list.push(frame_vertex);

        var frame_spring = make_frame_spring(frame_vertex, surface_vertex);
        frame_spring_list.push(frame_spring);

        var center = shape.calculate_center();
        frame_vertex.offset_x = frame_vertex.x - center.x;
        frame_vertex.offset_y = frame_vertex.y - center.y;
    }

    shape.particle_container = new Container(256, {
        position: true,
        rotation: false,
        uvs: false,
        tint: true,
    });

    globals.viewport.addChild(shape.particle_container);

    for (let vertex of surface_vertice_list.concat(inner_vertice_list)) {
        let particle = make_particle(globals, vertex.x, vertex.y);

        shape.particle_container.addChild(particle);
        shape.particle_holder.push(particle);
    }
}

export function make_1x1_square(globals, uses_frame, uses_inflation) {
    var surface_vertice_list = [];
    var inner_vertice_list = [];

    var frame_vertice_list = [];
    var frame_spring_list = [];

    var spring_list = [];

    let scale = 100;
    scale = 100;

    var inner_point_list = [
        {	x: 0.5,		 y: 0.5		},
    ]
    var inner_vertice_list = []
    for (let point of inner_point_list) {
        let vertex = make_vertice(point.x * scale, point.y * scale);
        inner_vertice_list.push(vertex)
    }

    var surface_point_list = [
        {	x: 1,		 y: 0.125	},
        {	x: 1,		 y: 0.875	},
        {	x: 0.875,	 y: 1		},
        {	x: 0.125,	 y: 1		},
        {	x: 0,		 y: 0.875	},
        {	x: 0,		 y: 0.125	},
        {	x: 0.125,	 y: 0		},
        {	x: 0.875,	 y: 0		},
    ]
    var surface_vertex_list = []
    for (let point of surface_point_list) {
        let vertex = make_vertice(point.x * scale, point.y * scale);
        surface_vertex_list.push(vertex)
    }

    for (let i = 0; i < surface_vertex_list.length; i++) {
        const vertex = surface_vertex_list[i]
        const prev_vertex = surface_vertex_list[mod(i-1, surface_vertex_list.length)]
        surface_vertice_list.push(vertex);
        var spring = make_spring(vertex, prev_vertex);
        spring_list.push(spring);
    }


    const temp_spring_list = [
        make_spring(surface_vertice_list[4], surface_vertice_list[5]),
        make_spring(surface_vertice_list[5], surface_vertice_list[6]),
        make_spring(surface_vertice_list[6], surface_vertice_list[7]),
        make_spring(surface_vertice_list[7], surface_vertice_list[0]),
        make_spring(surface_vertice_list[0], surface_vertice_list[1]),
        make_spring(surface_vertice_list[1], surface_vertice_list[2]),
        make_spring(surface_vertice_list[2], surface_vertice_list[3]),
        make_spring(surface_vertice_list[3], surface_vertice_list[4]),
        make_spring(inner_vertice_list[0], surface_vertice_list[4]),
        make_spring(surface_vertice_list[0], inner_vertice_list[0]),
        make_spring(surface_vertice_list[2], inner_vertice_list[0]),
        make_spring(surface_vertice_list[1], inner_vertice_list[0]),
        make_spring(surface_vertice_list[3], inner_vertice_list[0]),
        make_spring(surface_vertice_list[5], inner_vertice_list[0]),
        make_spring(surface_vertice_list[6], inner_vertice_list[0]),
        make_spring(surface_vertice_list[6], surface_vertice_list[3]),
        make_spring(surface_vertice_list[4], surface_vertice_list[1]),
        make_spring(surface_vertice_list[7], surface_vertice_list[2]),
        make_spring(surface_vertice_list[5], surface_vertice_list[0]),
        make_spring(surface_vertice_list[7], inner_vertice_list[0]),
    ]
    spring_list.push(...temp_spring_list);

    var shape = new Shape();
    shape.surface_vertice_holder = surface_vertice_list;
    shape.inner_vertice_holder = inner_vertice_list;
    shape.frame_vertice_holder = frame_vertice_list;
    shape.spring_holder = spring_list;
    shape.frame_spring_holder = frame_spring_list;
    shape.uses_frame = uses_frame;
    shape.uses_inflation = uses_inflation;

    globals.shapes_holder.push(shape);

    //For every surface vertex I want to make a frame vertex
    for (let surface_vertex of surface_vertice_list) {
        let frame_vertex = make_frame_vertice(
            globals,
            surface_vertex.x,
            surface_vertex.y,
        );
        frame_vertice_list.push(frame_vertex);

        var frame_spring = make_frame_spring(frame_vertex, surface_vertex);
        frame_spring_list.push(frame_spring);

        var center = shape.calculate_center();
        frame_vertex.offset_x = frame_vertex.x - center.x;
        frame_vertex.offset_y = frame_vertex.y - center.y;
    }

    shape.particle_container = new Container(256, {
        position: true,
        rotation: false,
        uvs: false,
        tint: true,
    });

    globals.viewport.addChild(shape.particle_container);

    for (let vertex of surface_vertice_list.concat(inner_vertice_list)) {
        let particle = make_particle(globals, vertex.x, vertex.y);

        shape.particle_container.addChild(particle);
        shape.particle_holder.push(particle);
    }
}

export function make_2x2_square(globals, uses_frame, uses_inflation) {
    var surface_vertice_list = [];
    var inner_vertice_list = [];

    var frame_vertice_list = [];
    var frame_spring_list = [];

    var spring_list = [];

    let scale = 100;
    scale = 100;

    var inner_point_list = [
        {	x: 0.5,		 y: 0.5		},
    ]
    var inner_vertice_list = []
    for (let point of inner_point_list) {
        let vertex = make_vertice(point.x * scale, point.y * scale);
        inner_vertice_list.push(vertex)
    }

    var surface_point_list = [
        {	x: 0,		 y: 0.125	},
        {	x: 0.125,	 y: 0		},
        {	x: 0.5,		 y: 0		},
        {	x: 0.875,	 y: 0		},
        {	x: 1,		 y: 0.125	},
        {	x: 1,		 y: 0.5		},
        {	x: 1,		 y: 0.875	},
        {	x: 0.875,	 y: 1		},
        {	x: 0.5,		 y: 1		},
        {	x: 0.125,	 y: 1		},
        {	x: 0,		 y: 0.875	},
        {	x: 0,		 y: 0.5		},
    ]
    var surface_vertex_list = []
    for (let point of surface_point_list) {
        let vertex = make_vertice(point.x * scale, point.y * scale);
        surface_vertex_list.push(vertex)
    }

    for (let i = 0; i < surface_vertex_list.length; i++) {
        const vertex = surface_vertex_list[i]
        const prev_vertex = surface_vertex_list[mod(i-1, surface_vertex_list.length)]
        surface_vertice_list.push(vertex);
        var spring = make_spring(vertex, prev_vertex);
        spring_list.push(spring);
    }


    const temp_spring_list = [
        make_spring(inner_vertice_list[0], surface_vertice_list[8]),
        make_spring(surface_vertice_list[2], inner_vertice_list[0]),
        make_spring(inner_vertice_list[0], surface_vertice_list[11]),
        make_spring(surface_vertice_list[5], inner_vertice_list[0]),
        make_spring(surface_vertice_list[11], surface_vertice_list[0]),
        make_spring(surface_vertice_list[0], surface_vertice_list[1]),
        make_spring(surface_vertice_list[1], surface_vertice_list[2]),
        make_spring(surface_vertice_list[2], surface_vertice_list[3]),
        make_spring(surface_vertice_list[3], surface_vertice_list[4]),
        make_spring(surface_vertice_list[4], surface_vertice_list[5]),
        make_spring(surface_vertice_list[10], surface_vertice_list[11]),
        make_spring(surface_vertice_list[8], surface_vertice_list[9]),
        make_spring(surface_vertice_list[9], surface_vertice_list[10]),
        make_spring(surface_vertice_list[5], surface_vertice_list[6]),
        make_spring(surface_vertice_list[6], surface_vertice_list[7]),
        make_spring(surface_vertice_list[7], surface_vertice_list[8]),
        make_spring(inner_vertice_list[0], surface_vertice_list[10]),
        make_spring(inner_vertice_list[0], surface_vertice_list[9]),
        make_spring(inner_vertice_list[0], surface_vertice_list[7]),
        make_spring(inner_vertice_list[0], surface_vertice_list[6]),
        make_spring(inner_vertice_list[0], surface_vertice_list[4]),
        make_spring(inner_vertice_list[0], surface_vertice_list[3]),
        make_spring(inner_vertice_list[0], surface_vertice_list[1]),
        make_spring(inner_vertice_list[0], surface_vertice_list[0]),
        make_spring(surface_vertice_list[8], surface_vertice_list[11]),
        make_spring(surface_vertice_list[8], surface_vertice_list[5]),
        make_spring(surface_vertice_list[2], surface_vertice_list[5]),
        make_spring(surface_vertice_list[2], surface_vertice_list[11]),
    ]
    spring_list.push(...temp_spring_list);

    var shape = new Shape();
    shape.surface_vertice_holder = surface_vertice_list;
    shape.inner_vertice_holder = inner_vertice_list;
    shape.frame_vertice_holder = frame_vertice_list;
    shape.spring_holder = spring_list;
    shape.frame_spring_holder = frame_spring_list;
    shape.uses_frame = uses_frame;
    shape.uses_inflation = uses_inflation;

    console.log("uses_frame:",uses_frame)

    globals.shapes_holder.push(shape);

    //For every surface vertex I want to make a frame vertex
    for (let surface_vertex of surface_vertice_list) {
        let frame_vertex = make_frame_vertice(
            globals,
            surface_vertex.x,
            surface_vertex.y,
        );
        frame_vertice_list.push(frame_vertex);

        var frame_spring = make_frame_spring(frame_vertex, surface_vertex);
        frame_spring_list.push(frame_spring);

        var center = shape.calculate_center();
        frame_vertex.offset_x = frame_vertex.x - center.x;
        frame_vertex.offset_y = frame_vertex.y - center.y;
    }

    shape.particle_container = new Container(256, {
        position: true,
        rotation: false,
        uvs: false,
        tint: true,
    });

    globals.viewport.addChild(shape.particle_container);

    for (let vertex of surface_vertice_list.concat(inner_vertice_list)) {
        let particle = make_particle(globals, vertex.x, vertex.y);

        shape.particle_container.addChild(particle);
        shape.particle_holder.push(particle);
    }
}

export function make_circle(globals, uses_frame, uses_inflation) {
    var surface_vertice_list = [];
    var inner_vertice_list = [];

    var frame_vertice_list = [];
    var frame_spring_list = [];

    var spring_list = [];

    let scale = 100;

    var inner_point_list = [
    ]
    var inner_vertice_list = []
    for (let point of inner_point_list) {
        let vertex = make_vertice(point.x * scale, point.y * scale);
        inner_vertice_list.push(vertex)
    }

    var surface_point_list = [
        {	x: 0.3087,	 y: 0.9619	},
        {	x: 0.5,		 y: 1		},
        {	x: 0.6913,	 y: 0.9619	},
        {	x: 0.8536,	 y: 0.8536	},
        {	x: 0.9619,	 y: 0.6913	},
        {	x: 1,		 y: 0.5		},
        {	x: 0.9619,	 y: 0.3087	},
        {	x: 0.8536,	 y: 0.1464	},
        {	x: 0.6913,	 y: 0.0381	},
        {	x: 0.5,		 y: 0		},
        {	x: 0.3087,	 y: 0.0381	},
        {	x: 0.1464,	 y: 0.1464	},
        {	x: 0.0381,	 y: 0.3087	},
        {	x: 0,		 y: 0.5		},
        {	x: 0.0381,	 y: 0.6913	},
        {	x: 0.1464,	 y: 0.8536	},
    ]
    var surface_vertex_list = []
    for (let point of surface_point_list) {
        let vertex = make_vertice(point.x * scale, point.y * scale);
        surface_vertex_list.push(vertex)
    }

    for (let i = 0; i < surface_vertex_list.length; i++) {
        const vertex = surface_vertex_list[i]
        const prev_vertex = surface_vertex_list[mod(i-1, surface_vertex_list.length)]
        surface_vertice_list.push(vertex);
        //var spring = make_spring(vertex, prev_vertex);
        //spring_list.push(spring);
    }

    /*
        */
    const temp_spring_list = [
        make_spring(surface_vertice_list[0], surface_vertice_list[1]),
        make_spring(surface_vertice_list[15], surface_vertice_list[0]),
        make_spring(surface_vertice_list[14], surface_vertice_list[15]),
        make_spring(surface_vertice_list[13], surface_vertice_list[14]),
        make_spring(surface_vertice_list[12], surface_vertice_list[13]),
        make_spring(surface_vertice_list[11], surface_vertice_list[12]),
        make_spring(surface_vertice_list[10], surface_vertice_list[11]),
        make_spring(surface_vertice_list[9], surface_vertice_list[10]),
        make_spring(surface_vertice_list[8], surface_vertice_list[9]),
        make_spring(surface_vertice_list[7], surface_vertice_list[8]),
        make_spring(surface_vertice_list[6], surface_vertice_list[7]),
        make_spring(surface_vertice_list[5], surface_vertice_list[6]),
        make_spring(surface_vertice_list[4], surface_vertice_list[5]),
        make_spring(surface_vertice_list[3], surface_vertice_list[4]),
        make_spring(surface_vertice_list[2], surface_vertice_list[3]),
        make_spring(surface_vertice_list[1], surface_vertice_list[2]),
        make_spring(surface_vertice_list[0], surface_vertice_list[13]),
        make_spring(surface_vertice_list[0], surface_vertice_list[3]),
        make_spring(surface_vertice_list[1], surface_vertice_list[14]),
        make_spring(surface_vertice_list[15], surface_vertice_list[2]),
        make_spring(surface_vertice_list[1], surface_vertice_list[4]),
        make_spring(surface_vertice_list[5], surface_vertice_list[2]),
        make_spring(surface_vertice_list[6], surface_vertice_list[3]),
        make_spring(surface_vertice_list[7], surface_vertice_list[4]),
        make_spring(surface_vertice_list[8], surface_vertice_list[5]),
        make_spring(surface_vertice_list[9], surface_vertice_list[6]),
        make_spring(surface_vertice_list[10], surface_vertice_list[7]),
        make_spring(surface_vertice_list[11], surface_vertice_list[8]),
        make_spring(surface_vertice_list[12], surface_vertice_list[9]),
        make_spring(surface_vertice_list[13], surface_vertice_list[10]),
        make_spring(surface_vertice_list[14], surface_vertice_list[11]),
        make_spring(surface_vertice_list[15], surface_vertice_list[12]),
    ]
    //const temp_spring_list = []
    spring_list.push(...temp_spring_list);

    const reversed_surface_vertice_list = surface_vertice_list.reverse();

    var shape = new Shape();
    shape.surface_vertice_holder = reversed_surface_vertice_list;
    shape.inner_vertice_holder = inner_vertice_list;
    shape.frame_vertice_holder = frame_vertice_list;
    shape.spring_holder = spring_list;
    shape.frame_spring_holder = frame_spring_list;
    shape.uses_frame = uses_frame;
    shape.uses_inflation = uses_inflation;
    shape.DAMPING = .3;

    globals.shapes_holder.push(shape);

    //For every surface vertex I want to make a frame vertex
    for (let surface_vertex of surface_vertice_list) {
        let frame_vertex = make_frame_vertice(
            globals,
            surface_vertex.x,
            surface_vertex.y,
        );
        frame_vertice_list.push(frame_vertex);

        var frame_spring = make_frame_spring(frame_vertex, surface_vertex);
        frame_spring_list.push(frame_spring);

        var center = shape.calculate_center();
        frame_vertex.offset_x = frame_vertex.x - center.x;
        frame_vertex.offset_y = frame_vertex.y - center.y;
    }

    shape.particle_container = new Container(256, {
        position: true,
        rotation: false,
        uvs: false,
        tint: true,
    });

    globals.viewport.addChild(shape.particle_container);

    for (let vertex of surface_vertice_list.concat(inner_vertice_list)) {
        let particle = make_particle(globals, vertex.x, vertex.y);

        shape.particle_container.addChild(particle);
        shape.particle_holder.push(particle);
    }
}

export function make_circle_2(globals, uses_frame, uses_inflation) {
    var surface_vertice_list = [];
    var inner_vertice_list = [];

    var frame_vertice_list = [];
    var frame_spring_list = [];

    var spring_list = [];

    let scale = 100;

    var inner_point_list = [
    ]
    var inner_vertice_list = []
    for (let point of inner_point_list) {
        let vertex = make_vertice(point.x * scale, point.y * scale);
        inner_vertice_list.push(vertex)
    }

    var surface_point_list = [
        {	x: 0.3087,	 y: 0.0381	},
        {	x: 0.1464,	 y: 0.1464	},
        {	x: 0.0381,	 y: 0.3087	},
        {	x: 0,		 y: 0.5		},
        {	x: 0.0381,	 y: 0.6913	},
        {	x: 0.1464,	 y: 0.8536	},
        {	x: 0.3087,	 y: 0.9619	},
        {	x: 0.5,		 y: 1		},
        {	x: 0.6913,	 y: 0.9619	},
        {	x: 0.8536,	 y: 0.8536	},
        {	x: 0.9619,	 y: 0.6913	},
        {	x: 1,		 y: 0.5		},
        {	x: 0.9619,	 y: 0.3087	},
        {	x: 0.8536,	 y: 0.1464	},
        {	x: 0.6913,	 y: 0.0381	},
        {	x: 0.5,		 y: 0		},
    ]
    var surface_vertex_list = []
    for (let point of surface_point_list) {
        let vertex = make_vertice(point.x * scale, point.y * scale);
        surface_vertex_list.push(vertex)
    }

    for (let i = 0; i < surface_vertex_list.length; i++) {
        const vertex = surface_vertex_list[i]
        const prev_vertex = surface_vertex_list[mod(i-1, surface_vertex_list.length)]
        surface_vertice_list.push(vertex);
        //var spring = make_spring(vertex, prev_vertex);
        //spring_list.push(spring);
    }

    /*
        */
    const temp_spring_list = [
        make_spring(surface_vertice_list[6], surface_vertice_list[7]),
        make_spring(surface_vertice_list[5], surface_vertice_list[6]),
        make_spring(surface_vertice_list[4], surface_vertice_list[5]),
        make_spring(surface_vertice_list[3], surface_vertice_list[4]),
        make_spring(surface_vertice_list[2], surface_vertice_list[3]),
        make_spring(surface_vertice_list[1], surface_vertice_list[2]),
        make_spring(surface_vertice_list[0], surface_vertice_list[1]),
        make_spring(surface_vertice_list[15], surface_vertice_list[0]),
        make_spring(surface_vertice_list[14], surface_vertice_list[15]),
        make_spring(surface_vertice_list[13], surface_vertice_list[14]),
        make_spring(surface_vertice_list[12], surface_vertice_list[13]),
        make_spring(surface_vertice_list[11], surface_vertice_list[12]),
        make_spring(surface_vertice_list[10], surface_vertice_list[11]),
        make_spring(surface_vertice_list[9], surface_vertice_list[10]),
        make_spring(surface_vertice_list[8], surface_vertice_list[9]),
        make_spring(surface_vertice_list[7], surface_vertice_list[8]),
        make_spring(surface_vertice_list[6], surface_vertice_list[3]),
        make_spring(surface_vertice_list[6], surface_vertice_list[9]),
        make_spring(surface_vertice_list[7], surface_vertice_list[4]),
        make_spring(surface_vertice_list[5], surface_vertice_list[8]),
        make_spring(surface_vertice_list[7], surface_vertice_list[10]),
        make_spring(surface_vertice_list[11], surface_vertice_list[8]),
        make_spring(surface_vertice_list[12], surface_vertice_list[9]),
        make_spring(surface_vertice_list[13], surface_vertice_list[10]),
        make_spring(surface_vertice_list[14], surface_vertice_list[11]),
        make_spring(surface_vertice_list[15], surface_vertice_list[12]),
        make_spring(surface_vertice_list[0], surface_vertice_list[13]),
        make_spring(surface_vertice_list[1], surface_vertice_list[14]),
        make_spring(surface_vertice_list[2], surface_vertice_list[15]),
        make_spring(surface_vertice_list[3], surface_vertice_list[0]),
        make_spring(surface_vertice_list[4], surface_vertice_list[1]),
        make_spring(surface_vertice_list[5], surface_vertice_list[2]),
        make_spring(surface_vertice_list[12], surface_vertice_list[8]),
        make_spring(surface_vertice_list[13], surface_vertice_list[9]),
        make_spring(surface_vertice_list[7], surface_vertice_list[11]),
        make_spring(surface_vertice_list[6], surface_vertice_list[10]),
        make_spring(surface_vertice_list[5], surface_vertice_list[9]),
        make_spring(surface_vertice_list[14], surface_vertice_list[10]),
        make_spring(surface_vertice_list[15], surface_vertice_list[11]),
        make_spring(surface_vertice_list[0], surface_vertice_list[12]),
        make_spring(surface_vertice_list[1], surface_vertice_list[13]),
        make_spring(surface_vertice_list[2], surface_vertice_list[14]),
        make_spring(surface_vertice_list[3], surface_vertice_list[15]),
        make_spring(surface_vertice_list[4], surface_vertice_list[0]),
        make_spring(surface_vertice_list[5], surface_vertice_list[1]),
        make_spring(surface_vertice_list[6], surface_vertice_list[2]),
        make_spring(surface_vertice_list[7], surface_vertice_list[3]),
        make_spring(surface_vertice_list[4], surface_vertice_list[8]),
    ]
    //const temp_spring_list = []
    spring_list.push(...temp_spring_list);

    const reversed_surface_vertice_list = surface_vertice_list.reverse();

    var shape = new Shape();
    shape.surface_vertice_holder = reversed_surface_vertice_list;
    shape.inner_vertice_holder = inner_vertice_list;
    shape.frame_vertice_holder = frame_vertice_list;
    shape.spring_holder = spring_list;
    shape.frame_spring_holder = frame_spring_list;
    shape.uses_frame = uses_frame;
    shape.uses_inflation = uses_inflation;
    shape.DAMPING = .8;

    globals.shapes_holder.push(shape);

    //For every surface vertex I want to make a frame vertex
    for (let surface_vertex of surface_vertice_list) {
        let frame_vertex = make_frame_vertice(
            globals,
            surface_vertex.x,
            surface_vertex.y,
        );
        frame_vertice_list.push(frame_vertex);

        var frame_spring = make_frame_spring(frame_vertex, surface_vertex);
        frame_spring_list.push(frame_spring);

        var center = shape.calculate_center();
        frame_vertex.offset_x = frame_vertex.x - center.x;
        frame_vertex.offset_y = frame_vertex.y - center.y;
    }

    shape.particle_container = new Container(256, {
        position: true,
        rotation: false,
        uvs: false,
        tint: true,
    });

    globals.viewport.addChild(shape.particle_container);

    for (let vertex of surface_vertice_list.concat(inner_vertice_list)) {
        let particle = make_particle(globals, vertex.x, vertex.y);

        shape.particle_container.addChild(particle);
        shape.particle_holder.push(particle);
    }
    return shape;
}


export function make_quad(globals, uses_frame, uses_inflation) {
    var surface_vertice_list = [];
    var inner_vertice_list = [];

    var frame_vertice_list = [];
    var frame_spring_list = [];

    var spring_list = [];

    let scale = 100;
    scale = 100;

    var inner_point_list = [
    ]
    var inner_vertice_list = []
    for (let point of inner_point_list) {
        let vertex = make_vertice(point.x * scale, point.y * scale);
        inner_vertice_list.push(vertex)
    }

    var surface_point_list = [
        {	x: 1,		 y: 0		},
        {	x: 1,		 y: 1		},
        {	x: 0,		 y: 1		},
        {	x: 0,		 y: 0		},
    ]
    var surface_vertex_list = []
    for (let point of surface_point_list) {
        let vertex = make_vertice(point.x * scale, point.y * scale);
        surface_vertex_list.push(vertex)
    }

    for (let i = 0; i < surface_vertex_list.length; i++) {
        const vertex = surface_vertex_list[i]
        const prev_vertex = surface_vertex_list[mod(i-1, surface_vertex_list.length)]
        surface_vertice_list.push(vertex);
        var spring = make_spring(vertex, prev_vertex);
        spring_list.push(spring);
    }

    /*
    const temp_spring_list = [
        make_spring(surface_vertice_list[5], surface_vertice_list[6]),
        make_spring(surface_vertice_list[4], surface_vertice_list[5]),
        make_spring(surface_vertice_list[3], surface_vertice_list[4]),
        make_spring(surface_vertice_list[2], surface_vertice_list[3]),
        make_spring(surface_vertice_list[1], surface_vertice_list[2]),
        make_spring(surface_vertice_list[0], surface_vertice_list[1]),
        make_spring(surface_vertice_list[15], surface_vertice_list[0]),
        make_spring(surface_vertice_list[14], surface_vertice_list[15]),
        make_spring(surface_vertice_list[13], surface_vertice_list[14]),
        make_spring(surface_vertice_list[12], surface_vertice_list[13]),
        make_spring(surface_vertice_list[11], surface_vertice_list[12]),
        make_spring(surface_vertice_list[10], surface_vertice_list[11]),
        make_spring(surface_vertice_list[9], surface_vertice_list[10]),
        make_spring(surface_vertice_list[8], surface_vertice_list[9]),
        make_spring(surface_vertice_list[7], surface_vertice_list[8]),
        make_spring(surface_vertice_list[6], surface_vertice_list[7]),
        make_spring(surface_vertice_list[5], surface_vertice_list[2]),
        make_spring(surface_vertice_list[5], surface_vertice_list[8]),
        make_spring(surface_vertice_list[6], surface_vertice_list[3]),
        make_spring(surface_vertice_list[4], surface_vertice_list[7]),
        make_spring(surface_vertice_list[6], surface_vertice_list[9]),
        make_spring(surface_vertice_list[10], surface_vertice_list[7]),
        make_spring(surface_vertice_list[11], surface_vertice_list[8]),
        make_spring(surface_vertice_list[12], surface_vertice_list[9]),
        make_spring(surface_vertice_list[13], surface_vertice_list[10]),
        make_spring(surface_vertice_list[14], surface_vertice_list[11]),
        make_spring(surface_vertice_list[15], surface_vertice_list[12]),
        make_spring(surface_vertice_list[0], surface_vertice_list[13]),
        make_spring(surface_vertice_list[1], surface_vertice_list[14]),
        make_spring(surface_vertice_list[2], surface_vertice_list[15]),
        make_spring(surface_vertice_list[3], surface_vertice_list[0]),
        make_spring(surface_vertice_list[4], surface_vertice_list[1]),
    ]
        */
    const temp_spring_list = []
    spring_list.push(...temp_spring_list);

    const reversed_surface_vertice_list = surface_vertice_list.reverse();

    var shape = new Shape();
    shape.surface_vertice_holder = surface_vertice_list;
    shape.inner_vertice_holder = inner_vertice_list;
    shape.frame_vertice_holder = frame_vertice_list;
    shape.spring_holder = spring_list;
    shape.frame_spring_holder = frame_spring_list;
    shape.uses_frame = uses_frame;
    shape.uses_inflation = uses_inflation;

    globals.shapes_holder.push(shape);

    //For every surface vertex I want to make a frame vertex
    for (let surface_vertex of surface_vertice_list) {
        let frame_vertex = make_frame_vertice(
            globals,
            surface_vertex.x,
            surface_vertex.y,
        );
        frame_vertice_list.push(frame_vertex);

        var frame_spring = make_frame_spring(frame_vertex, surface_vertex);
        frame_spring_list.push(frame_spring);

        var center = shape.calculate_center();
        frame_vertex.offset_x = frame_vertex.x - center.x;
        frame_vertex.offset_y = frame_vertex.y - center.y;
    }

    shape.particle_container = new Container(256, {
        position: true,
        rotation: false,
        uvs: false,
        tint: true,
    });

    globals.viewport.addChild(shape.particle_container);

    for (let vertex of surface_vertice_list.concat(inner_vertice_list)) {
        let particle = make_particle(globals, vertex.x, vertex.y);

        shape.particle_container.addChild(particle);
        shape.particle_holder.push(particle);
    }
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

export function setup(globals, app, width, height, pin_number) {
  width = 10;
  height = 10;

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

  globals.vertex_holder = [];
  globals.line_holder = new Set();
  globals.particle_holder = [];
  globals.all_lines_graphics = new Graphics();
  globals.bounding_box_graphics = new Graphics();
  globals.debug_graphics_layer_1 = new Graphics();
  globals.debug_graphics_layer_2 = new Graphics();
  globals.debug_graphics_layer_3 = new Graphics();

  globals.line_length = 30;
  globals.all_lines_graphics.setStrokeStyle({ color: 0x000000, width: 1 });
  globals.bounding_box_graphics.setStrokeStyle({ color: 0x00ff00, width: 1 });
  globals.debug_graphics_layer_1.setStrokeStyle({ color: 0x00ffff, width: 1 });
  globals.debug_graphics_layer_2.setStrokeStyle({ color: 0x0000ff, width: 1 });
  globals.debug_graphics_layer_3.setStrokeStyle({ color: 0xff00ff, width: 1 });

  globals.viewport.addChild(globals.polygon_graphics);

  globals.viewport.addChild(globals.all_lines_graphics);
  globals.viewport.addChild(globals.bounding_box_graphics);
  globals.viewport.addChild(globals.debug_graphics_layer_1);
  globals.viewport.addChild(globals.debug_graphics_layer_2);
  globals.viewport.addChild(globals.debug_graphics_layer_3);

  globals.particle_container = new Container(256, {
    position: true,
    rotation: false,
    uvs: false,
    tint: true,
  });

  globals.viewport.addChild(globals.particle_container);

  globals.circle_texture = createCircleTexture(app, 3);
}

export function set_up_event_listeners(globals, elements, constants, app) {
    app.canvas.addEventListener("touchstart", (event) => {
        const touches = event.changedTouches;
        const last_touch = touches[touches.length - 1];
        globals.mouse_position = { x: last_touch.clientX, y: last_touch.clientY };
        globals.drag_mode = true;
        globals.actively_dragging = false;
    });

    app.canvas.addEventListener("touchend", (event) => {
        const touches = event.changedTouches;
        const last_touch = touches[touches.length - 1];
        globals.mouse_position = { x: last_touch.clientX, y: last_touch.clientY };
        globals.drag_mode = false;
        globals.actively_dragging = false;
        if (globals.chosen_dragging_vertex != null) {
            globals.chosen_dragging_vertex.grabbed = false;
        }
    });

    app.canvas.addEventListener("touchcancel", (event) => {
        const touches = event.changedTouches;
        const last_touch = touches[touches.length - 1];
        globals.mouse_position = { x: last_touch.clientX, y: last_touch.clientY };
        globals.drag_mode = false;
        globals.actively_dragging = false;
        if (globals.chosen_dragging_vertex != null) {
            globals.chosen_dragging_vertex.grabbed = false;
        }
    });

    app.canvas.addEventListener("touchmove", (event) => {
        const touches = event.changedTouches;
        const last_touch = touches[touches.length - 1];
        globals.mouse_position = { x: last_touch.clientX, y: last_touch.clientY };
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
        globals.mouse_position = { x: event.clientX, y: event.clientY };
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

    window.addEventListener("keydown", (event) => {
        globals.keys_pressed[event.key] = true;
    });

    window.addEventListener("keyup", (event) => {
        delete globals.keys_pressed[event.key]
    });

    elements.play_toggle_button.onclick = function () {
        globals.edit_mode = !globals.edit_mode;
    };
    elements.build_button.onclick = function () {
        //make_1x1_square(globals);

        let shape_selection_dropdown_value = elements.shape_selection_dropdown.value;
        let uses_frame_checkbox_value = elements.uses_frame_checkbox.checked;
        let uses_inflation_checkbox_value = elements.uses_inflation_checkbox.checked;


        if (shape_selection_dropdown_value == "2x2-square") {
            make_2x2_square(globals, uses_frame_checkbox_value, uses_inflation_checkbox_value);
        } else if (shape_selection_dropdown_value == "4x4-square") {
            make_4x4_square(globals, uses_frame_checkbox_value, uses_inflation_checkbox_value);
        } else if (shape_selection_dropdown_value == "circle") {
            make_circle(globals, uses_frame_checkbox_value, uses_inflation_checkbox_value);
        } else if (shape_selection_dropdown_value == "circle-2") {
            make_circle_2(globals, uses_frame_checkbox_value, uses_inflation_checkbox_value);
        } else if (shape_selection_dropdown_value == "quad") {
            make_quad(globals, uses_frame_checkbox_value, uses_inflation_checkbox_value);
        }
    };
}