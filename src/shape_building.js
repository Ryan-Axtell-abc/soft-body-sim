import { generate_frame_segements_for_rectangles, make_frame_spring, make_frame_vertice, make_particle, make_spring, make_vertice, mod } from "./functions.js";
import { Container } from "pixi.js";
import { Accelerator, Handle, Shape } from "./classes.js";

export function general_shape(globals, scale, inner_point_list, surface_point_list, spring_data_list, frame_index_lists_collection, is_frame_fixed_collection, damping) {

    // I want to handle multiple frames
    // To do that I can't just generate the frame from the surface verts, I need to pass in frame info


    var frame_vertice_list = [];
    var frame_spring_list = [];


    const inner_vertice_list = []
    for (let point of inner_point_list) {
        let vertex = make_vertice(point.x * scale, point.y * scale);
        inner_vertice_list.push(vertex)
    }

    const surface_vertex_list = []
    for (let point of surface_point_list) {
        const vertex = make_vertice(point.x * scale, point.y * scale);
        surface_vertex_list.push(vertex)
    }

    const spring_list = [];

    for (let spring_data of spring_data_list) {
        let spring_list_a = inner_vertice_list;
        if (spring_data.a.spring_list == "surface") {
            spring_list_a = surface_vertex_list;
        }
        let spring_list_b = inner_vertice_list;
        if (spring_data.b.spring_list == "surface") {
            spring_list_b = surface_vertex_list;
        }
        spring_list.push( make_spring(spring_list_a[spring_data.a.index], spring_list_b[spring_data.b.index]) );

    }


    var shape = new Shape();
    shape.surface_vertice_holder = surface_vertex_list;
    shape.inner_vertice_holder = inner_vertice_list;

    const frame_data_collection = []
    for (let i = 0; i < frame_index_lists_collection.length; i++) {
        const frame_index_list = frame_index_lists_collection[i];
        const is_frame_fixed = is_frame_fixed_collection[i];
        const frame_vertex_holder = [];
        const surface_vertex_holder = [];
        const frame_spring_holder = [];
        for (let frame_index of frame_index_list) {

            const surface_vertex = surface_vertex_list[frame_index];
            const frame_vertex = make_frame_vertice(
                globals,
                surface_vertex.x,
                surface_vertex.y,
            );
            frame_vertex_holder.push(frame_vertex);
            surface_vertex_holder.push(surface_vertex);
    
            const frame_spring = make_frame_spring(frame_vertex, surface_vertex);
            frame_spring_holder.push(frame_spring);
        }
        var center = shape.calculate_center_of_certain_verts(frame_vertex_holder);
        for (let frame_vertex of frame_vertex_holder) {
            frame_vertex.offset_x = frame_vertex.x - center.x;
            frame_vertex.offset_y = frame_vertex.y - center.y;
        }
        const frame_data_pack = {
            vertex_arrays: {
                frame_vertices: frame_vertex_holder,
                body_vertices: surface_vertex_holder,
            },
            spring_list: frame_spring_holder,
            fixed: is_frame_fixed,
        }
        frame_data_collection.push(frame_data_pack);
    }

    shape.frame_collection = frame_data_collection;
    
    shape.spring_holder = spring_list;
    shape.DAMPING = damping;

    globals.shapes_holder.push(shape);

    //For every surface vertex I want to make a frame vertex
    for (let surface_vertex of surface_vertex_list) {
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

    for (let vertex of surface_vertex_list.concat(inner_vertice_list)) {
        let particle = make_particle(globals, vertex.x, vertex.y);

        shape.particle_container.addChild(particle);
        shape.particle_holder.push(particle);
    }

    return shape;
}


export function general_accelerator(globals, scale, surface_point_list) {

    const surface_vertex_list = []
    for (let point of surface_point_list) {
        const vertex = make_vertice(point.x * scale, point.y * scale);
        surface_vertex_list.push(vertex)
    }


    var accelerator = new Accelerator();
    accelerator.surface_vertice_holder = surface_vertex_list;

    globals.accelerators_holder.push(accelerator);

    return accelerator;
}

export function general_rectangle_builder(globals, scale, width, height, is_multiple_frames, frame_segment_width, is_bridge){


    width = Math.max(width, 2);
    height = Math.max(height, 2);
    frame_segment_width = Math.min(Math.max(frame_segment_width, 3), 5);

    // inner points will be layer by layer going up I guess
    // total inner points is (width-1) * (height-1)

    const inner_position_to_index_map = new Map();
    function get_inner_point_position_from_index(i) {
        const row = Math.floor(i/(width-1))+1;
        const column = i%(width-1)+1;
        const x_pos = column*.5
        const y_pos = row*.5

        const key = x_pos.toString()+"x"+y_pos.toString()
        inner_position_to_index_map.set(key, i);
        return {
            x: x_pos,
            y: y_pos
        }

    }
    const total_inner_points = (width-1) * (height-1)
    const inner_points = []
    for (let i = 0; i < total_inner_points; i++) {
        const position = get_inner_point_position_from_index(i)
        //console.log("i:", i, "x:", position.x, "y:", position.y, "index:", index)
        inner_points.push(position)

    }

    // surface points will require a different technique. I need to start on the lower lefthand side then loop around
    // Maybe I imagine if this had not beveled corners first

    const surface_position_to_index_map = new Map();

    function make_spring_from_key(key, group, i) {
        const surface_index = surface_position_to_index_map.get(key);
        const inner_index = inner_position_to_index_map.get(key);
        let chosen_group;
        let chosen_index;
        if (surface_index != undefined) {
            chosen_group = "surface";
            chosen_index = surface_index;
        } else {
            chosen_group = "inner";
            chosen_index = inner_index;
        }

        const spring = {
            a: {
                spring_list: group,
                index: i
            },
            b: {
                spring_list: chosen_group,
                index: chosen_index
            }
        }
        return spring;

    }

    function get_outer_point_position_from_index(i) {
        let row
        let column
        // I guess I'll keep track of what wall I'm on
        if (i < width+1 + 2) {
            // I'm on the bottom
            if ( (i == 0) || (i == 1) || (i == width+1) || (i == width+2) ) {

                let return_x;
                let return_y;
                if (i == 0) {
                    return_x = 0
                    return_y = .125
                } else if (i == 1) {
                    return_x = .125
                    return_y = 0
                } else if (i == width+1) {
                    return_x = (i-1)*.5-.125
                    return_y = 0
                } else if (i == width+2) {
                    return_x = (i-2)*.5
                    return_y = .125
                }
                const key = return_x.toString()+"x"+return_y.toString()
                surface_position_to_index_map.set(key, i);

                return {
                    x: return_x,
                    y: return_y
                }

            }
            row = 0;
            column = i-1;

        } else if (i < (width+1+2)+(height-1)) {
            row = i-(width+2);
            column = width;

        } else if (i < (width+1+2)*2+(height-1)) {
            if ( (i == (width+1+2)+(height-1)) || (i == (width+1+2)+(height-1)+1) || (i == (width+1+2)*2+(height-1)-2) || (i == (width+1+2)*2+(height-1)-1) ) {
                let return_x;
                let return_y;
                if (i == (width+1+2)+(height-1)) {
                    return_x = width*.5;
                    return_y = (height)*.5-.125;
                } else if (i == (width+1+2)+(height-1)+1) {
                    return_x = (width*.5)-.125;
                    return_y = (height)*.5;
                } else if (i == (width+1+2)*2+(height-1)-2) {
                    return_x = .125;
                    return_y = (height)*.5;
                } else if (i == (width+1+2)*2+(height-1)-1) {
                    return_x = 0;
                    return_y = (height)*.5-.125;
                }
                const key = return_x.toString()+"x"+return_y.toString()
                surface_position_to_index_map.set(key, i);
                return {
                    x: return_x,
                    y: return_y
                }
            }
            row = height;
            column = (width+1+2)+(width+1)+(height-1) -i;

        } else if (i < (width+1+2)*2+(height-1)*2) {
            row = (width+2)*2 + height*2 - i;
            column = 0;

        }
        //const row = Math.floor(index/width)+1;
        //const column = (index-1)%(width-1) + 1;
        const x_pos = column*.5
        const y_pos = row*.5

        const key = x_pos.toString()+"x"+y_pos.toString()
        surface_position_to_index_map.set(key, i);
        return {
            x: x_pos,
            y: y_pos
        }

    }

    const spring_data_list = [];

    const total_outer_points = (width+1+2)*2 + (height-1)*2;
    const surface_points = [];
    for (let i = 0; i < total_outer_points; i++) {
        //console.log("i:", i)
        //console.log(i, get_outer_point_position_from_index(i))
        const position = get_outer_point_position_from_index(i)
        surface_points.push(position)

        const spring = {
            a: {
                spring_list: "surface",
                index: i
            },
            b: {
                spring_list: "surface",
                index: mod(i-1, total_outer_points)
            }
        }
        spring_data_list.push(spring)
    }


    for (let i = 0; i < inner_points.length; i++) {
        const current_point = inner_points[i];
        const bottom_left_key = (current_point.x-.5).toString()+"x"+(current_point.y-.5).toString();
        if (bottom_left_key != "0x0") {
            const spring = make_spring_from_key(bottom_left_key, "inner", i)
            spring_data_list.push(spring)
        }

        const bottom_right_key = (current_point.x+.5).toString()+"x"+(current_point.y-.5).toString();
        if (bottom_right_key != (width*.5).toString()+"x0") {
            const spring = make_spring_from_key(bottom_right_key, "inner", i)
            spring_data_list.push(spring)
        }

        {
            const bottom_key = (current_point.x).toString()+"x"+(current_point.y-.5).toString();
            const spring = make_spring_from_key(bottom_key, "inner", i)
            spring_data_list.push(spring)
        }
        {
            const left_key = (current_point.x-.5).toString()+"x"+(current_point.y).toString();
            const spring = make_spring_from_key(left_key, "inner", i)
            spring_data_list.push(spring)
        }

    }

    // Loop through top row surface points
    const top_row = []
    for (let i = (width+1+2)+(height-1)+2; i < (width+1+2)+(height-1)+width+1; i++) {
        top_row.push(i)
    }
    top_row.reverse();
    for (let i of top_row) {
        const current_point = surface_points[i];
        const bottom_left_key = (current_point.x-.5).toString()+"x"+(current_point.y-.5).toString();
        if (bottom_left_key != "0x0") {
            const spring = make_spring_from_key(bottom_left_key, "surface", i)
            spring_data_list.push(spring)
        }

        const bottom_right_key = (current_point.x+.5).toString()+"x"+(current_point.y-.5).toString();
        if (bottom_right_key != (width*.5).toString()+"x0") {
            const spring = make_spring_from_key(bottom_right_key, "surface", i)
            spring_data_list.push(spring)
        }

        {
            const bottom_key = (current_point.x).toString()+"x"+(current_point.y-.5).toString();
            const spring = make_spring_from_key(bottom_key, "surface", i)
            spring_data_list.push(spring)
        }
    }

    const right_column = []
    for (let i = width+3; i < width+3+(height-1); i++) {
        right_column.push(i)
    }
    right_column.reverse();
    for (let i of right_column) {
        const current_point = surface_points[i];
        const bottom_left_key = (current_point.x-.5).toString()+"x"+(current_point.y-.5).toString();
        if (bottom_left_key != "0x0") {
            const spring = make_spring_from_key(bottom_left_key, "surface", i)
            spring_data_list.push(spring)
        }
        {
            const left_key = (current_point.x-.5).toString()+"x"+(current_point.y).toString();
            const spring = make_spring_from_key(left_key, "surface", i)
            spring_data_list.push(spring)
        }
    }

    const left_column = []
    for (let i = (width+1+2)*2+(height-1); i < (width+1+2)*2+(height-1)+(height-1); i++) {
        left_column.push(i)
    }
    left_column.reverse();
    for (let i of left_column) {
        const current_point = surface_points[i];
        const bottom_right_key = (current_point.x+.5).toString()+"x"+(current_point.y-.5).toString();
        if (bottom_right_key != (width*.5).toString()+"x0") {
            const spring = make_spring_from_key(bottom_right_key, "surface", i)
            spring_data_list.push(spring)
        }
    }


    // Fill in corners
    {
        const spring = {
            a: {
                spring_list: "surface",
                index: 0
            },
            b: {
                spring_list: "inner",
                index: 0
            }
        }
        spring_data_list.push(spring)
    }
    {
        const spring = {
            a: {
                spring_list: "surface",
                index: 1
            },
            b: {
                spring_list: "inner",
                index: 0
            }
        }
        spring_data_list.push(spring)
    }
    {
        const spring = {
            a: {
                spring_list: "surface",
                index: width+1
            },
            b: {
                spring_list: "inner",
                index: width-2
            }
        }
        spring_data_list.push(spring)
    }
    {
        const spring = {
            a: {
                spring_list: "surface",
                index: width+2
            },
            b: {
                spring_list: "inner",
                index: width-2
            }
        }
        spring_data_list.push(spring)
    }

    {
        const spring = {
            a: {
                spring_list: "surface",
                index: surface_points.length -1 - (height-1)
            },
            b: {
                spring_list: "inner",
                index: inner_points.length -1 - (width-2)
            }
        }
        spring_data_list.push(spring)
    }
    {
        const spring = {
            a: {
                spring_list: "surface",
                index: surface_points.length -1 - (height-0)
            },
            b: {
                spring_list: "inner",
                index: inner_points.length -1 - (width-2)
            }
        }
        spring_data_list.push(spring)
    }
    {
        const spring = {
            a: {
                spring_list: "surface",
                index: (width+1+2) + height -1
            },
            b: {
                spring_list: "inner",
                index: inner_points.length -1
            }
        }
        spring_data_list.push(spring)
    }
    {
        const spring = {
            a: {
                spring_list: "surface",
                index: (width+1+2) + height
            },
            b: {
                spring_list: "inner",
                index: inner_points.length -1
            }
        }
        spring_data_list.push(spring)
    }
    
    
    let frame_indices_segment_collection = [];
    let is_frame_fixed_collection = [];

    if (is_multiple_frames) {
        const generated_frame_results = generate_frame_segements_for_rectangles(width, height, frame_segment_width, false);
        frame_indices_segment_collection = generated_frame_results[0];
        is_frame_fixed_collection = generated_frame_results[1];
        if (is_bridge) {
            is_frame_fixed_collection[0] = true
            is_frame_fixed_collection[is_frame_fixed_collection.length-1] = true
        }
    } else {
        const frame_index_lists_collection = [];
        for (let i = 0; i < surface_points.length; i++) {
            frame_index_lists_collection.push(i);
    
        }
        frame_indices_segment_collection = [frame_index_lists_collection]
        is_frame_fixed_collection = [false]
    }

    

    const shape = general_shape(globals, scale, inner_points, surface_points, spring_data_list, frame_indices_segment_collection, is_frame_fixed_collection, .2)
    

    if (is_multiple_frames && is_bridge) {

        const left_frame_indices = frame_indices_segment_collection[0];
        const left_frame_verts = []
        for (let index of left_frame_indices) {
            const vertex = shape.surface_vertice_holder[index]
            left_frame_verts.push(vertex)
        }
        const left_frame_average_position = shape.calculate_center_of_certain_verts(left_frame_verts);
        //console.log("left_frame_average_position:", left_frame_average_position)
        const left_handle = new Handle(left_frame_average_position.x, left_frame_average_position.y, left_frame_verts, shape);
        left_handle.x += 20;
        globals.handles_holder.push(left_handle)
        shape.left_handle = left_handle;

        const right_frame_indices = frame_indices_segment_collection[frame_indices_segment_collection.length -1];
        const right_frame_verts = []
        for (let index of right_frame_indices) {
            const vertex = shape.surface_vertice_holder[index]
            right_frame_verts.push(vertex)
        }
        const right_frame_average_position = shape.calculate_center_of_certain_verts(right_frame_verts);
        //console.log("right_frame_average_position:", right_frame_average_position)
        const right_handle = new Handle(right_frame_average_position.x, right_frame_average_position.y, right_frame_verts, shape);
        right_handle.x += 20;
        globals.handles_holder.push(right_handle)
        shape.right_handle = right_handle;
    }
    return shape;

}

export function make_circle_1(globals) {

    const inner_point_list = [
    ]
    
    const surface_point_list = [
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
    
    const spring_data_list = [
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'surface', index: 7, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'surface', index: 6, }, },
        { a: { spring_list: 'surface', index: 4, }, b: { spring_list: 'surface', index: 5, }, },
        { a: { spring_list: 'surface', index: 3, }, b: { spring_list: 'surface', index: 4, }, },
        { a: { spring_list: 'surface', index: 2, }, b: { spring_list: 'surface', index: 3, }, },
        { a: { spring_list: 'surface', index: 1, }, b: { spring_list: 'surface', index: 2, }, },
        { a: { spring_list: 'surface', index: 0, }, b: { spring_list: 'surface', index: 1, }, },
        { a: { spring_list: 'surface', index: 15, }, b: { spring_list: 'surface', index: 0, }, },
        { a: { spring_list: 'surface', index: 14, }, b: { spring_list: 'surface', index: 15, }, },
        { a: { spring_list: 'surface', index: 13, }, b: { spring_list: 'surface', index: 14, }, },
        { a: { spring_list: 'surface', index: 12, }, b: { spring_list: 'surface', index: 13, }, },
        { a: { spring_list: 'surface', index: 11, }, b: { spring_list: 'surface', index: 12, }, },
        { a: { spring_list: 'surface', index: 10, }, b: { spring_list: 'surface', index: 11, }, },
        { a: { spring_list: 'surface', index: 9, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'surface', index: 8, }, b: { spring_list: 'surface', index: 9, }, },
        { a: { spring_list: 'surface', index: 7, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'surface', index: 3, }, },
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'surface', index: 9, }, },
        { a: { spring_list: 'surface', index: 7, }, b: { spring_list: 'surface', index: 4, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'surface', index: 7, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'surface', index: 11, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'surface', index: 12, }, b: { spring_list: 'surface', index: 9, }, },
        { a: { spring_list: 'surface', index: 13, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'surface', index: 14, }, b: { spring_list: 'surface', index: 11, }, },
        { a: { spring_list: 'surface', index: 15, }, b: { spring_list: 'surface', index: 12, }, },
        { a: { spring_list: 'surface', index: 0, }, b: { spring_list: 'surface', index: 13, }, },
        { a: { spring_list: 'surface', index: 1, }, b: { spring_list: 'surface', index: 14, }, },
        { a: { spring_list: 'surface', index: 2, }, b: { spring_list: 'surface', index: 15, }, },
        { a: { spring_list: 'surface', index: 3, }, b: { spring_list: 'surface', index: 0, }, },
        { a: { spring_list: 'surface', index: 4, }, b: { spring_list: 'surface', index: 1, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'surface', index: 2, }, },
    ]
    
const frame_index_lists_collection = [];
    for (let i = 0; i < surface_point_list.length; i++) {
        frame_index_lists_collection.push(i);

    }

    const shape = general_shape(globals, 100, inner_point_list, surface_point_list, spring_data_list, [frame_index_lists_collection], [false], .2)

    return shape;
}

export function make_circle_2(globals) {

    const inner_point_list = [
    ]
    
    const surface_point_list = [
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
    
    const spring_data_list = [
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'surface', index: 7, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'surface', index: 6, }, },
        { a: { spring_list: 'surface', index: 4, }, b: { spring_list: 'surface', index: 5, }, },
        { a: { spring_list: 'surface', index: 3, }, b: { spring_list: 'surface', index: 4, }, },
        { a: { spring_list: 'surface', index: 2, }, b: { spring_list: 'surface', index: 3, }, },
        { a: { spring_list: 'surface', index: 1, }, b: { spring_list: 'surface', index: 2, }, },
        { a: { spring_list: 'surface', index: 0, }, b: { spring_list: 'surface', index: 1, }, },
        { a: { spring_list: 'surface', index: 15, }, b: { spring_list: 'surface', index: 0, }, },
        { a: { spring_list: 'surface', index: 14, }, b: { spring_list: 'surface', index: 15, }, },
        { a: { spring_list: 'surface', index: 13, }, b: { spring_list: 'surface', index: 14, }, },
        { a: { spring_list: 'surface', index: 12, }, b: { spring_list: 'surface', index: 13, }, },
        { a: { spring_list: 'surface', index: 11, }, b: { spring_list: 'surface', index: 12, }, },
        { a: { spring_list: 'surface', index: 10, }, b: { spring_list: 'surface', index: 11, }, },
        { a: { spring_list: 'surface', index: 9, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'surface', index: 8, }, b: { spring_list: 'surface', index: 9, }, },
        { a: { spring_list: 'surface', index: 7, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'surface', index: 3, }, },
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'surface', index: 9, }, },
        { a: { spring_list: 'surface', index: 7, }, b: { spring_list: 'surface', index: 4, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'surface', index: 7, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'surface', index: 11, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'surface', index: 12, }, b: { spring_list: 'surface', index: 9, }, },
        { a: { spring_list: 'surface', index: 13, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'surface', index: 14, }, b: { spring_list: 'surface', index: 11, }, },
        { a: { spring_list: 'surface', index: 15, }, b: { spring_list: 'surface', index: 12, }, },
        { a: { spring_list: 'surface', index: 0, }, b: { spring_list: 'surface', index: 13, }, },
        { a: { spring_list: 'surface', index: 1, }, b: { spring_list: 'surface', index: 14, }, },
        { a: { spring_list: 'surface', index: 2, }, b: { spring_list: 'surface', index: 15, }, },
        { a: { spring_list: 'surface', index: 3, }, b: { spring_list: 'surface', index: 0, }, },
        { a: { spring_list: 'surface', index: 4, }, b: { spring_list: 'surface', index: 1, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'surface', index: 2, }, },
        { a: { spring_list: 'surface', index: 12, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'surface', index: 13, }, b: { spring_list: 'surface', index: 9, }, },
        { a: { spring_list: 'surface', index: 7, }, b: { spring_list: 'surface', index: 11, }, },
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'surface', index: 9, }, },
        { a: { spring_list: 'surface', index: 14, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'surface', index: 15, }, b: { spring_list: 'surface', index: 11, }, },
        { a: { spring_list: 'surface', index: 0, }, b: { spring_list: 'surface', index: 12, }, },
        { a: { spring_list: 'surface', index: 1, }, b: { spring_list: 'surface', index: 13, }, },
        { a: { spring_list: 'surface', index: 2, }, b: { spring_list: 'surface', index: 14, }, },
        { a: { spring_list: 'surface', index: 3, }, b: { spring_list: 'surface', index: 15, }, },
        { a: { spring_list: 'surface', index: 4, }, b: { spring_list: 'surface', index: 0, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'surface', index: 1, }, },
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'surface', index: 2, }, },
        { a: { spring_list: 'surface', index: 7, }, b: { spring_list: 'surface', index: 3, }, },
        { a: { spring_list: 'surface', index: 4, }, b: { spring_list: 'surface', index: 8, }, },
    ]

    const frame_index_lists_collection = [];
    for (let i = 0; i < surface_point_list.length; i++) {
        frame_index_lists_collection.push(i);

    }

    const shape = general_shape(globals, 170, inner_point_list, surface_point_list, spring_data_list, [frame_index_lists_collection], [false], .2)

    return shape;
}

export function make_quad(globals) {

    const inner_point_list = [
    ]
    
    const surface_point_list = [
        {	x: 0,		 y: 0		},
        {	x: 1,		 y: 0		},
        {	x: 1,		 y: 1		},
        {	x: 0,		 y: 1		},
    ]
    
    const spring_data_list = [
        { a: { spring_list: 'surface', index: 3, }, b: { spring_list: 'surface', index: 0, }, },
        { a: { spring_list: 'surface', index: 0, }, b: { spring_list: 'surface', index: 1, }, },
        { a: { spring_list: 'surface', index: 1, }, b: { spring_list: 'surface', index: 2, }, },
        { a: { spring_list: 'surface', index: 2, }, b: { spring_list: 'surface', index: 3, }, },
    ]
    
    const frame_index_lists_collection = [];
    for (let i = 0; i < surface_point_list.length; i++) {
        frame_index_lists_collection.push(i);

    }

    const shape = general_shape(globals, 100, inner_point_list, surface_point_list, spring_data_list, [frame_index_lists_collection], [false], .2)

    return shape;
}

export function make_car_body(globals) {


    const inner_point_list = [
    ]
    
    const surface_point_list = [
        {	x: 0.3259,	 y: 0.4671	},
        {	x: 0.4018,	 y: 0.4179	},
        {	x: 0.7285,	 y: 0.4642	},
        {	x: 1.1259,	 y: 0.3031	},
        {	x: 1.7925,	 y: 0.311	},
        {	x: 2.2453,	 y: 0.5624	},
        {	x: 2.7576,	 y: 0.655	},
        {	x: 2.8159,	 y: 0.7257	},
        {	x: 2.8144,	 y: 0.861	},
        {	x: 2.7104,	 y: 1.2244	},
        {	x: 2.6345,	 y: 1.2737	},
        {	x: 2.3078,	 y: 1.2273	},
        {	x: 1.9104,	 y: 1.3884	},
        {	x: 1.2438,	 y: 1.3806	},
        {	x: 0.791,	 y: 1.1292	},
        {	x: 0.2787,	 y: 1.0365	},
        {	x: 0.2204,	 y: 0.9658	},
        {	x: 0.222,	 y: 0.8305	},
    ]

    const spring_data_list = [
        { a: { spring_list: 'surface', index: 12, }, b: { spring_list: 'surface', index: 11, }, },
        { a: { spring_list: 'surface', index: 14, }, b: { spring_list: 'surface', index: 13, }, },
        { a: { spring_list: 'surface', index: 13, }, b: { spring_list: 'surface', index: 12, }, },
        { a: { spring_list: 'surface', index: 2, }, b: { spring_list: 'surface', index: 3, }, },
        { a: { spring_list: 'surface', index: 4, }, b: { spring_list: 'surface', index: 5, }, },
        { a: { spring_list: 'surface', index: 3, }, b: { spring_list: 'surface', index: 4, }, },
        { a: { spring_list: 'surface', index: 16, }, b: { spring_list: 'surface', index: 15, }, },
        { a: { spring_list: 'surface', index: 9, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'surface', index: 7, }, b: { spring_list: 'surface', index: 6, }, },
        { a: { spring_list: 'surface', index: 0, }, b: { spring_list: 'surface', index: 1, }, },
        { a: { spring_list: 'surface', index: 16, }, b: { spring_list: 'surface', index: 17, }, },
        { a: { spring_list: 'surface', index: 15, }, b: { spring_list: 'surface', index: 14, }, },
        { a: { spring_list: 'surface', index: 9, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'surface', index: 10, }, b: { spring_list: 'surface', index: 11, }, },
        { a: { spring_list: 'surface', index: 7, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'surface', index: 5, }, },
        { a: { spring_list: 'surface', index: 0, }, b: { spring_list: 'surface', index: 17, }, },
        { a: { spring_list: 'surface', index: 1, }, b: { spring_list: 'surface', index: 2, }, },
        { a: { spring_list: 'surface', index: 12, }, b: { spring_list: 'surface', index: 4, }, },
        { a: { spring_list: 'surface', index: 13, }, b: { spring_list: 'surface', index: 3, }, },
        { a: { spring_list: 'surface', index: 13, }, b: { spring_list: 'surface', index: 4, }, },
        { a: { spring_list: 'surface', index: 12, }, b: { spring_list: 'surface', index: 3, }, },
        { a: { spring_list: 'surface', index: 12, }, b: { spring_list: 'surface', index: 5, }, },
        { a: { spring_list: 'surface', index: 11, }, b: { spring_list: 'surface', index: 4, }, },
        { a: { spring_list: 'surface', index: 11, }, b: { spring_list: 'surface', index: 5, }, },
        { a: { spring_list: 'surface', index: 13, }, b: { spring_list: 'surface', index: 2, }, },
        { a: { spring_list: 'surface', index: 14, }, b: { spring_list: 'surface', index: 3, }, },
        { a: { spring_list: 'surface', index: 14, }, b: { spring_list: 'surface', index: 2, }, },
        { a: { spring_list: 'surface', index: 14, }, b: { spring_list: 'surface', index: 1, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'surface', index: 9, }, },
        { a: { spring_list: 'surface', index: 14, }, b: { spring_list: 'surface', index: 0, }, },
        { a: { spring_list: 'surface', index: 11, }, b: { spring_list: 'surface', index: 6, }, },
        { a: { spring_list: 'surface', index: 2, }, b: { spring_list: 'surface', index: 15, }, },
        { a: { spring_list: 'surface', index: 2, }, b: { spring_list: 'surface', index: 16, }, },
        { a: { spring_list: 'surface', index: 17, }, b: { spring_list: 'surface', index: 2, }, },
        { a: { spring_list: 'surface', index: 11, }, b: { spring_list: 'surface', index: 7, }, },
        { a: { spring_list: 'surface', index: 11, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'surface', index: 10, }, b: { spring_list: 'surface', index: 6, }, },
        { a: { spring_list: 'surface', index: 15, }, b: { spring_list: 'surface', index: 1, }, },
        { a: { spring_list: 'surface', index: 16, }, b: { spring_list: 'surface', index: 1, }, },
        { a: { spring_list: 'surface', index: 10, }, b: { spring_list: 'surface', index: 7, }, },
        { a: { spring_list: 'surface', index: 15, }, b: { spring_list: 'surface', index: 0, }, },
        { a: { spring_list: 'surface', index: 9, }, b: { spring_list: 'surface', index: 6, }, },
        { a: { spring_list: 'surface', index: 8, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'surface', index: 17, }, b: { spring_list: 'surface', index: 1, }, },
    ]

    const frame_index_lists_collection = [];
    for (let i = 0; i < surface_point_list.length; i++) {
        frame_index_lists_collection.push(i);

    }

    const shape = general_shape(globals, 90, inner_point_list, surface_point_list, spring_data_list, [frame_index_lists_collection], [false], .2)

    return shape;
}


export function make_2x40_bridge(globals) {
    
    const inner_point_list = [
        {	x: 0.983,	 y: 0.3706	},
        {	x: 0.5,		 y: 0.5		},
        {	x: 1.4659,	 y: 0.2412	},
        {	x: 3.8807,	 y: -0.4059	},
        {	x: 4.3637,	 y: -0.5353	},
        {	x: 4.8467,	 y: -0.6647	},
        {	x: 5.3296,	 y: -0.7941	},
        {	x: 1.9489,	 y: 0.1118	},
        {	x: 2.4319,	 y: -0.0176	},
        {	x: 2.9148,	 y: -0.147	},
        {	x: 3.3978,	 y: -0.2765	},
        {	x: 7.7444,	 y: -1.4411	},
        {	x: 8.2274,	 y: -1.5706	},
        {	x: 8.7104,	 y: -1.7	},
        {	x: 9.1933,	 y: -1.8294	},
        {	x: 5.8126,	 y: -0.9235	},
        {	x: 6.2956,	 y: -1.0529	},
        {	x: 6.7785,	 y: -1.1823	},
        {	x: 7.2615,	 y: -1.3117	},
        {	x: 9.6763,	 y: -1.9588	},
        {	x: 10.6422,	 y: -2.2176	},
        {	x: 10.1593,	 y: -2.0882	},
        {	x: 11.1252,	 y: -2.347	},
        {	x: 13.54,	 y: -2.9941	},
        {	x: 14.023,	 y: -3.1235	},
        {	x: 14.5059,	 y: -3.2529	},
        {	x: 14.9889,	 y: -3.3823	},
        {	x: 11.6081,	 y: -2.4764	},
        {	x: 12.0911,	 y: -2.6058	},
        {	x: 12.5741,	 y: -2.7352	},
        {	x: 13.057,	 y: -2.8646	},
        {	x: 17.4037,	 y: -4.0293	},
        {	x: 17.8867,	 y: -4.1587	},
        {	x: 18.3696,	 y: -4.2882	},
        {	x: 18.8526,	 y: -4.4176	},
        {	x: 15.4719,	 y: -3.5117	},
        {	x: 15.9548,	 y: -3.6411	},
        {	x: 16.4378,	 y: -3.7705	},
        {	x: 16.9207,	 y: -3.8999	},
    ]
    
    const surface_point_list = [
        {	x: -0.08,	 y: 0.2672	},
        {	x: 0.0084,	 y: 0.1141	},
        {	x: 0.3706,	 y: 0.017	},
        {	x: 0.8536,	 y: -0.1124	},
        {	x: 1.3365,	 y: -0.2418	},
        {	x: 1.8195,	 y: -0.3712	},
        {	x: 2.3024,	 y: -0.5006	},
        {	x: 2.7854,	 y: -0.63	},
        {	x: 3.2684,	 y: -0.7594	},
        {	x: 3.7513,	 y: -0.8888	},
        {	x: 4.2343,	 y: -1.0182	},
        {	x: 4.7173,	 y: -1.1476	},
        {	x: 5.2002,	 y: -1.2771	},
        {	x: 5.6832,	 y: -1.4065	},
        {	x: 6.1661,	 y: -1.5359	},
        {	x: 6.6491,	 y: -1.6653	},
        {	x: 7.1321,	 y: -1.7947	},
        {	x: 7.615,	 y: -1.9241	},
        {	x: 8.098,	 y: -2.0535	},
        {	x: 8.581,	 y: -2.1829	},
        {	x: 9.0639,	 y: -2.3123	},
        {	x: 9.5469,	 y: -2.4417	},
        {	x: 10.0298,	 y: -2.5712	},
        {	x: 10.5128,	 y: -2.7006	},
        {	x: 10.9958,	 y: -2.83	},
        {	x: 11.4787,	 y: -2.9594	},
        {	x: 11.9617,	 y: -3.0888	},
        {	x: 12.4447,	 y: -3.2182	},
        {	x: 12.9276,	 y: -3.3476	},
        {	x: 13.4106,	 y: -3.477	},
        {	x: 13.8936,	 y: -3.6064	},
        {	x: 14.3765,	 y: -3.7358	},
        {	x: 14.8595,	 y: -3.8652	},
        {	x: 15.3424,	 y: -3.9947	},
        {	x: 15.8254,	 y: -4.1241	},
        {	x: 16.3084,	 y: -4.2535	},
        {	x: 16.7913,	 y: -4.3829	},
        {	x: 17.2743,	 y: -4.5123	},
        {	x: 17.7573,	 y: -4.6417	},
        {	x: 18.2402,	 y: -4.7711	},
        {	x: 18.7232,	 y: -4.9005	},
        {	x: 19.0854,	 y: -4.9976	},
        {	x: 19.2385,	 y: -4.9092	},
        {	x: 19.3356,	 y: -4.547	},
        {	x: 19.4326,	 y: -4.1847	},
        {	x: 19.3442,	 y: -4.0317	},
        {	x: 18.982,	 y: -3.9346	},
        {	x: 18.499,	 y: -3.8052	},
        {	x: 18.0161,	 y: -3.6758	},
        {	x: 17.5331,	 y: -3.5464	},
        {	x: 17.0501,	 y: -3.417	},
        {	x: 16.5672,	 y: -3.2876	},
        {	x: 16.0842,	 y: -3.1581	},
        {	x: 15.6013,	 y: -3.0287	},
        {	x: 15.1183,	 y: -2.8993	},
        {	x: 14.6353,	 y: -2.7699	},
        {	x: 14.1524,	 y: -2.6405	},
        {	x: 13.6694,	 y: -2.5111	},
        {	x: 13.1864,	 y: -2.3817	},
        {	x: 12.7035,	 y: -2.2523	},
        {	x: 12.2205,	 y: -2.1229	},
        {	x: 11.7376,	 y: -1.9935	},
        {	x: 11.2546,	 y: -1.864	},
        {	x: 10.7716,	 y: -1.7346	},
        {	x: 10.2887,	 y: -1.6052	},
        {	x: 9.8057,	 y: -1.4758	},
        {	x: 9.3227,	 y: -1.3464	},
        {	x: 8.8398,	 y: -1.217	},
        {	x: 8.3568,	 y: -1.0876	},
        {	x: 7.8739,	 y: -0.9582	},
        {	x: 7.3909,	 y: -0.8288	},
        {	x: 6.9079,	 y: -0.6994	},
        {	x: 6.425,	 y: -0.57	},
        {	x: 5.942,	 y: -0.4405	},
        {	x: 5.459,	 y: -0.3111	},
        {	x: 4.9761,	 y: -0.1817	},
        {	x: 4.4931,	 y: -0.0523	},
        {	x: 4.0101,	 y: 0.0771	},
        {	x: 3.5272,	 y: 0.2065	},
        {	x: 3.0442,	 y: 0.3359	},
        {	x: 2.5613,	 y: 0.4653	},
        {	x: 2.0783,	 y: 0.5947	},
        {	x: 1.5953,	 y: 0.7241	},
        {	x: 1.1124,	 y: 0.8536	},
        {	x: 0.6294,	 y: 0.983	},
        {	x: 0.2672,	 y: 1.08	},
        {	x: 0.1141,	 y: 0.9916	},
        {	x: 0.017,	 y: 0.6294	},
    ]
    
    const spring_data_list = [
        { a: { spring_list: 'inner', index: 1, }, b: { spring_list: 'surface', index: 84, }, },
        { a: { spring_list: 'surface', index: 2, }, b: { spring_list: 'inner', index: 1, }, },
        { a: { spring_list: 'inner', index: 1, }, b: { spring_list: 'surface', index: 87, }, },
        { a: { spring_list: 'inner', index: 0, }, b: { spring_list: 'inner', index: 1, }, },
        { a: { spring_list: 'surface', index: 87, }, b: { spring_list: 'surface', index: 0, }, },
        { a: { spring_list: 'surface', index: 0, }, b: { spring_list: 'surface', index: 1, }, },
        { a: { spring_list: 'surface', index: 1, }, b: { spring_list: 'surface', index: 2, }, },
        { a: { spring_list: 'surface', index: 2, }, b: { spring_list: 'surface', index: 3, }, },
        { a: { spring_list: 'inner', index: 1, }, b: { spring_list: 'surface', index: 3, }, },
        { a: { spring_list: 'surface', index: 86, }, b: { spring_list: 'surface', index: 87, }, },
        { a: { spring_list: 'surface', index: 84, }, b: { spring_list: 'surface', index: 85, }, },
        { a: { spring_list: 'surface', index: 85, }, b: { spring_list: 'surface', index: 86, }, },
        { a: { spring_list: 'inner', index: 1, }, b: { spring_list: 'surface', index: 83, }, },
        { a: { spring_list: 'surface', index: 83, }, b: { spring_list: 'surface', index: 84, }, },
        { a: { spring_list: 'inner', index: 1, }, b: { spring_list: 'surface', index: 86, }, },
        { a: { spring_list: 'inner', index: 1, }, b: { spring_list: 'surface', index: 85, }, },
        { a: { spring_list: 'surface', index: 83, }, b: { spring_list: 'surface', index: 82, }, },
        { a: { spring_list: 'surface', index: 3, }, b: { spring_list: 'surface', index: 4, }, },
        { a: { spring_list: 'inner', index: 0, }, b: { spring_list: 'inner', index: 2, }, },
        { a: { spring_list: 'inner', index: 1, }, b: { spring_list: 'surface', index: 1, }, },
        { a: { spring_list: 'inner', index: 1, }, b: { spring_list: 'surface', index: 0, }, },
        { a: { spring_list: 'surface', index: 84, }, b: { spring_list: 'surface', index: 87, }, },
        { a: { spring_list: 'surface', index: 84, }, b: { spring_list: 'inner', index: 0, }, },
        { a: { spring_list: 'surface', index: 2, }, b: { spring_list: 'inner', index: 0, }, },
        { a: { spring_list: 'surface', index: 2, }, b: { spring_list: 'surface', index: 87, }, },
        { a: { spring_list: 'surface', index: 8, }, b: { spring_list: 'surface', index: 9, }, },
        { a: { spring_list: 'inner', index: 10, }, b: { spring_list: 'inner', index: 3, }, },
        { a: { spring_list: 'surface', index: 78, }, b: { spring_list: 'surface', index: 77, }, },
        { a: { spring_list: 'surface', index: 9, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'inner', index: 3, }, b: { spring_list: 'inner', index: 4, }, },
        { a: { spring_list: 'surface', index: 77, }, b: { spring_list: 'surface', index: 76, }, },
        { a: { spring_list: 'surface', index: 10, }, b: { spring_list: 'surface', index: 11, }, },
        { a: { spring_list: 'inner', index: 4, }, b: { spring_list: 'inner', index: 5, }, },
        { a: { spring_list: 'surface', index: 76, }, b: { spring_list: 'surface', index: 75, }, },
        { a: { spring_list: 'surface', index: 11, }, b: { spring_list: 'surface', index: 12, }, },
        { a: { spring_list: 'inner', index: 5, }, b: { spring_list: 'inner', index: 6, }, },
        { a: { spring_list: 'surface', index: 75, }, b: { spring_list: 'surface', index: 74, }, },
        { a: { spring_list: 'surface', index: 82, }, b: { spring_list: 'inner', index: 2, }, },
        { a: { spring_list: 'inner', index: 2, }, b: { spring_list: 'surface', index: 4, }, },
        { a: { spring_list: 'inner', index: 3, }, b: { spring_list: 'surface', index: 77, }, },
        { a: { spring_list: 'inner', index: 4, }, b: { spring_list: 'surface', index: 76, }, },
        { a: { spring_list: 'inner', index: 5, }, b: { spring_list: 'surface', index: 75, }, },
        { a: { spring_list: 'inner', index: 6, }, b: { spring_list: 'surface', index: 74, }, },
        { a: { spring_list: 'surface', index: 12, }, b: { spring_list: 'inner', index: 6, }, },
        { a: { spring_list: 'surface', index: 11, }, b: { spring_list: 'inner', index: 5, }, },
        { a: { spring_list: 'surface', index: 10, }, b: { spring_list: 'inner', index: 4, }, },
        { a: { spring_list: 'surface', index: 9, }, b: { spring_list: 'inner', index: 3, }, },
        { a: { spring_list: 'surface', index: 83, }, b: { spring_list: 'inner', index: 2, }, },
        { a: { spring_list: 'inner', index: 3, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'surface', index: 77, }, b: { spring_list: 'inner', index: 4, }, },
        { a: { spring_list: 'inner', index: 4, }, b: { spring_list: 'surface', index: 11, }, },
        { a: { spring_list: 'surface', index: 76, }, b: { spring_list: 'inner', index: 5, }, },
        { a: { spring_list: 'inner', index: 5, }, b: { spring_list: 'surface', index: 12, }, },
        { a: { spring_list: 'surface', index: 75, }, b: { spring_list: 'inner', index: 6, }, },
        { a: { spring_list: 'inner', index: 0, }, b: { spring_list: 'surface', index: 83, }, },
        { a: { spring_list: 'inner', index: 0, }, b: { spring_list: 'surface', index: 3, }, },
        { a: { spring_list: 'surface', index: 3, }, b: { spring_list: 'inner', index: 2, }, },
        { a: { spring_list: 'inner', index: 3, }, b: { spring_list: 'surface', index: 76, }, },
        { a: { spring_list: 'surface', index: 10, }, b: { spring_list: 'inner', index: 5, }, },
        { a: { spring_list: 'inner', index: 5, }, b: { spring_list: 'surface', index: 74, }, },
        { a: { spring_list: 'surface', index: 11, }, b: { spring_list: 'inner', index: 6, }, },
        { a: { spring_list: 'inner', index: 0, }, b: { spring_list: 'surface', index: 82, }, },
        { a: { spring_list: 'inner', index: 0, }, b: { spring_list: 'surface', index: 4, }, },
        { a: { spring_list: 'surface', index: 9, }, b: { spring_list: 'inner', index: 4, }, },
        { a: { spring_list: 'inner', index: 4, }, b: { spring_list: 'surface', index: 75, }, },
        { a: { spring_list: 'inner', index: 6, }, b: { spring_list: 'inner', index: 15, }, },
        { a: { spring_list: 'surface', index: 74, }, b: { spring_list: 'inner', index: 15, }, },
        { a: { spring_list: 'inner', index: 6, }, b: { spring_list: 'surface', index: 73, }, },
        { a: { spring_list: 'surface', index: 12, }, b: { spring_list: 'surface', index: 13, }, },
        { a: { spring_list: 'inner', index: 6, }, b: { spring_list: 'surface', index: 13, }, },
        { a: { spring_list: 'surface', index: 74, }, b: { spring_list: 'surface', index: 73, }, },
        { a: { spring_list: 'surface', index: 12, }, b: { spring_list: 'inner', index: 15, }, },
        { a: { spring_list: 'surface', index: 4, }, b: { spring_list: 'surface', index: 5, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'surface', index: 6, }, },
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'surface', index: 7, }, },
        { a: { spring_list: 'surface', index: 7, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'inner', index: 2, }, b: { spring_list: 'inner', index: 7, }, },
        { a: { spring_list: 'inner', index: 7, }, b: { spring_list: 'inner', index: 8, }, },
        { a: { spring_list: 'inner', index: 8, }, b: { spring_list: 'inner', index: 9, }, },
        { a: { spring_list: 'inner', index: 9, }, b: { spring_list: 'inner', index: 10, }, },
        { a: { spring_list: 'surface', index: 82, }, b: { spring_list: 'surface', index: 81, }, },
        { a: { spring_list: 'surface', index: 81, }, b: { spring_list: 'surface', index: 80, }, },
        { a: { spring_list: 'surface', index: 80, }, b: { spring_list: 'surface', index: 79, }, },
        { a: { spring_list: 'surface', index: 79, }, b: { spring_list: 'surface', index: 78, }, },
        { a: { spring_list: 'inner', index: 7, }, b: { spring_list: 'surface', index: 81, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'inner', index: 7, }, },
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'inner', index: 8, }, },
        { a: { spring_list: 'inner', index: 8, }, b: { spring_list: 'surface', index: 80, }, },
        { a: { spring_list: 'inner', index: 9, }, b: { spring_list: 'surface', index: 79, }, },
        { a: { spring_list: 'surface', index: 7, }, b: { spring_list: 'inner', index: 9, }, },
        { a: { spring_list: 'surface', index: 8, }, b: { spring_list: 'inner', index: 10, }, },
        { a: { spring_list: 'inner', index: 10, }, b: { spring_list: 'surface', index: 78, }, },
        { a: { spring_list: 'surface', index: 4, }, b: { spring_list: 'inner', index: 7, }, },
        { a: { spring_list: 'inner', index: 7, }, b: { spring_list: 'surface', index: 80, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'inner', index: 8, }, },
        { a: { spring_list: 'inner', index: 8, }, b: { spring_list: 'surface', index: 79, }, },
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'inner', index: 9, }, },
        { a: { spring_list: 'inner', index: 9, }, b: { spring_list: 'surface', index: 78, }, },
        { a: { spring_list: 'surface', index: 7, }, b: { spring_list: 'inner', index: 10, }, },
        { a: { spring_list: 'inner', index: 10, }, b: { spring_list: 'surface', index: 77, }, },
        { a: { spring_list: 'inner', index: 3, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'inner', index: 2, }, b: { spring_list: 'surface', index: 81, }, },
        { a: { spring_list: 'inner', index: 2, }, b: { spring_list: 'surface', index: 5, }, },
        { a: { spring_list: 'inner', index: 3, }, b: { spring_list: 'surface', index: 78, }, },
        { a: { spring_list: 'surface', index: 82, }, b: { spring_list: 'inner', index: 7, }, },
        { a: { spring_list: 'inner', index: 7, }, b: { spring_list: 'surface', index: 6, }, },
        { a: { spring_list: 'surface', index: 81, }, b: { spring_list: 'inner', index: 8, }, },
        { a: { spring_list: 'inner', index: 8, }, b: { spring_list: 'surface', index: 7, }, },
        { a: { spring_list: 'surface', index: 80, }, b: { spring_list: 'inner', index: 9, }, },
        { a: { spring_list: 'inner', index: 9, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'surface', index: 79, }, b: { spring_list: 'inner', index: 10, }, },
        { a: { spring_list: 'inner', index: 10, }, b: { spring_list: 'surface', index: 9, }, },
        { a: { spring_list: 'surface', index: 16, }, b: { spring_list: 'surface', index: 17, }, },
        { a: { spring_list: 'inner', index: 18, }, b: { spring_list: 'inner', index: 11, }, },
        { a: { spring_list: 'surface', index: 70, }, b: { spring_list: 'surface', index: 69, }, },
        { a: { spring_list: 'surface', index: 17, }, b: { spring_list: 'surface', index: 18, }, },
        { a: { spring_list: 'inner', index: 11, }, b: { spring_list: 'inner', index: 12, }, },
        { a: { spring_list: 'surface', index: 69, }, b: { spring_list: 'surface', index: 68, }, },
        { a: { spring_list: 'surface', index: 18, }, b: { spring_list: 'surface', index: 19, }, },
        { a: { spring_list: 'inner', index: 12, }, b: { spring_list: 'inner', index: 13, }, },
        { a: { spring_list: 'surface', index: 68, }, b: { spring_list: 'surface', index: 67, }, },
        { a: { spring_list: 'surface', index: 19, }, b: { spring_list: 'surface', index: 20, }, },
        { a: { spring_list: 'inner', index: 13, }, b: { spring_list: 'inner', index: 14, }, },
        { a: { spring_list: 'surface', index: 67, }, b: { spring_list: 'surface', index: 66, }, },
        { a: { spring_list: 'inner', index: 11, }, b: { spring_list: 'surface', index: 69, }, },
        { a: { spring_list: 'inner', index: 12, }, b: { spring_list: 'surface', index: 68, }, },
        { a: { spring_list: 'inner', index: 13, }, b: { spring_list: 'surface', index: 67, }, },
        { a: { spring_list: 'inner', index: 14, }, b: { spring_list: 'surface', index: 66, }, },
        { a: { spring_list: 'surface', index: 20, }, b: { spring_list: 'inner', index: 14, }, },
        { a: { spring_list: 'surface', index: 19, }, b: { spring_list: 'inner', index: 13, }, },
        { a: { spring_list: 'surface', index: 18, }, b: { spring_list: 'inner', index: 12, }, },
        { a: { spring_list: 'surface', index: 17, }, b: { spring_list: 'inner', index: 11, }, },
        { a: { spring_list: 'inner', index: 11, }, b: { spring_list: 'surface', index: 18, }, },
        { a: { spring_list: 'surface', index: 69, }, b: { spring_list: 'inner', index: 12, }, },
        { a: { spring_list: 'inner', index: 12, }, b: { spring_list: 'surface', index: 19, }, },
        { a: { spring_list: 'surface', index: 68, }, b: { spring_list: 'inner', index: 13, }, },
        { a: { spring_list: 'inner', index: 13, }, b: { spring_list: 'surface', index: 20, }, },
        { a: { spring_list: 'surface', index: 67, }, b: { spring_list: 'inner', index: 14, }, },
        { a: { spring_list: 'inner', index: 11, }, b: { spring_list: 'surface', index: 68, }, },
        { a: { spring_list: 'surface', index: 18, }, b: { spring_list: 'inner', index: 13, }, },
        { a: { spring_list: 'inner', index: 13, }, b: { spring_list: 'surface', index: 66, }, },
        { a: { spring_list: 'surface', index: 19, }, b: { spring_list: 'inner', index: 14, }, },
        { a: { spring_list: 'surface', index: 17, }, b: { spring_list: 'inner', index: 12, }, },
        { a: { spring_list: 'inner', index: 12, }, b: { spring_list: 'surface', index: 67, }, },
        { a: { spring_list: 'inner', index: 14, }, b: { spring_list: 'surface', index: 65, }, },
        { a: { spring_list: 'inner', index: 19, }, b: { spring_list: 'surface', index: 21, }, },
        { a: { spring_list: 'surface', index: 13, }, b: { spring_list: 'surface', index: 14, }, },
        { a: { spring_list: 'surface', index: 14, }, b: { spring_list: 'surface', index: 15, }, },
        { a: { spring_list: 'surface', index: 15, }, b: { spring_list: 'surface', index: 16, }, },
        { a: { spring_list: 'inner', index: 15, }, b: { spring_list: 'inner', index: 16, }, },
        { a: { spring_list: 'inner', index: 16, }, b: { spring_list: 'inner', index: 17, }, },
        { a: { spring_list: 'inner', index: 17, }, b: { spring_list: 'inner', index: 18, }, },
        { a: { spring_list: 'surface', index: 73, }, b: { spring_list: 'surface', index: 72, }, },
        { a: { spring_list: 'surface', index: 72, }, b: { spring_list: 'surface', index: 71, }, },
        { a: { spring_list: 'surface', index: 71, }, b: { spring_list: 'surface', index: 70, }, },
        { a: { spring_list: 'inner', index: 15, }, b: { spring_list: 'surface', index: 73, }, },
        { a: { spring_list: 'surface', index: 13, }, b: { spring_list: 'inner', index: 15, }, },
        { a: { spring_list: 'surface', index: 14, }, b: { spring_list: 'inner', index: 16, }, },
        { a: { spring_list: 'inner', index: 16, }, b: { spring_list: 'surface', index: 72, }, },
        { a: { spring_list: 'inner', index: 17, }, b: { spring_list: 'surface', index: 71, }, },
        { a: { spring_list: 'surface', index: 15, }, b: { spring_list: 'inner', index: 17, }, },
        { a: { spring_list: 'surface', index: 16, }, b: { spring_list: 'inner', index: 18, }, },
        { a: { spring_list: 'inner', index: 18, }, b: { spring_list: 'surface', index: 70, }, },
        { a: { spring_list: 'inner', index: 15, }, b: { spring_list: 'surface', index: 72, }, },
        { a: { spring_list: 'surface', index: 13, }, b: { spring_list: 'inner', index: 16, }, },
        { a: { spring_list: 'inner', index: 16, }, b: { spring_list: 'surface', index: 71, }, },
        { a: { spring_list: 'surface', index: 14, }, b: { spring_list: 'inner', index: 17, }, },
        { a: { spring_list: 'inner', index: 17, }, b: { spring_list: 'surface', index: 70, }, },
        { a: { spring_list: 'surface', index: 15, }, b: { spring_list: 'inner', index: 18, }, },
        { a: { spring_list: 'inner', index: 18, }, b: { spring_list: 'surface', index: 69, }, },
        { a: { spring_list: 'inner', index: 11, }, b: { spring_list: 'surface', index: 16, }, },
        { a: { spring_list: 'inner', index: 11, }, b: { spring_list: 'surface', index: 70, }, },
        { a: { spring_list: 'inner', index: 15, }, b: { spring_list: 'surface', index: 14, }, },
        { a: { spring_list: 'surface', index: 73, }, b: { spring_list: 'inner', index: 16, }, },
        { a: { spring_list: 'inner', index: 16, }, b: { spring_list: 'surface', index: 15, }, },
        { a: { spring_list: 'surface', index: 72, }, b: { spring_list: 'inner', index: 17, }, },
        { a: { spring_list: 'inner', index: 17, }, b: { spring_list: 'surface', index: 16, }, },
        { a: { spring_list: 'surface', index: 71, }, b: { spring_list: 'inner', index: 18, }, },
        { a: { spring_list: 'inner', index: 18, }, b: { spring_list: 'surface', index: 17, }, },
        { a: { spring_list: 'inner', index: 21, }, b: { spring_list: 'surface', index: 64, }, },
        { a: { spring_list: 'surface', index: 22, }, b: { spring_list: 'inner', index: 21, }, },
        { a: { spring_list: 'inner', index: 21, }, b: { spring_list: 'inner', index: 19, }, },
        { a: { spring_list: 'inner', index: 20, }, b: { spring_list: 'inner', index: 21, }, },
        { a: { spring_list: 'surface', index: 21, }, b: { spring_list: 'surface', index: 22, }, },
        { a: { spring_list: 'surface', index: 22, }, b: { spring_list: 'surface', index: 23, }, },
        { a: { spring_list: 'inner', index: 21, }, b: { spring_list: 'surface', index: 23, }, },
        { a: { spring_list: 'surface', index: 64, }, b: { spring_list: 'surface', index: 65, }, },
        { a: { spring_list: 'inner', index: 21, }, b: { spring_list: 'surface', index: 63, }, },
        { a: { spring_list: 'surface', index: 63, }, b: { spring_list: 'surface', index: 64, }, },
        { a: { spring_list: 'surface', index: 65, }, b: { spring_list: 'surface', index: 66, }, },
        { a: { spring_list: 'inner', index: 21, }, b: { spring_list: 'surface', index: 65, }, },
        { a: { spring_list: 'surface', index: 63, }, b: { spring_list: 'surface', index: 62, }, },
        { a: { spring_list: 'surface', index: 23, }, b: { spring_list: 'surface', index: 24, }, },
        { a: { spring_list: 'inner', index: 20, }, b: { spring_list: 'inner', index: 22, }, },
        { a: { spring_list: 'surface', index: 21, }, b: { spring_list: 'surface', index: 20, }, },
        { a: { spring_list: 'surface', index: 65, }, b: { spring_list: 'inner', index: 19, }, },
        { a: { spring_list: 'surface', index: 64, }, b: { spring_list: 'inner', index: 19, }, },
        { a: { spring_list: 'surface', index: 64, }, b: { spring_list: 'inner', index: 20, }, },
        { a: { spring_list: 'surface', index: 22, }, b: { spring_list: 'inner', index: 20, }, },
        { a: { spring_list: 'surface', index: 22, }, b: { spring_list: 'inner', index: 19, }, },
        { a: { spring_list: 'surface', index: 28, }, b: { spring_list: 'surface', index: 29, }, },
        { a: { spring_list: 'inner', index: 30, }, b: { spring_list: 'inner', index: 23, }, },
        { a: { spring_list: 'surface', index: 58, }, b: { spring_list: 'surface', index: 57, }, },
        { a: { spring_list: 'surface', index: 29, }, b: { spring_list: 'surface', index: 30, }, },
        { a: { spring_list: 'inner', index: 23, }, b: { spring_list: 'inner', index: 24, }, },
        { a: { spring_list: 'surface', index: 57, }, b: { spring_list: 'surface', index: 56, }, },
        { a: { spring_list: 'surface', index: 30, }, b: { spring_list: 'surface', index: 31, }, },
        { a: { spring_list: 'inner', index: 24, }, b: { spring_list: 'inner', index: 25, }, },
        { a: { spring_list: 'surface', index: 56, }, b: { spring_list: 'surface', index: 55, }, },
        { a: { spring_list: 'surface', index: 31, }, b: { spring_list: 'surface', index: 32, }, },
        { a: { spring_list: 'inner', index: 25, }, b: { spring_list: 'inner', index: 26, }, },
        { a: { spring_list: 'surface', index: 55, }, b: { spring_list: 'surface', index: 54, }, },
        { a: { spring_list: 'surface', index: 62, }, b: { spring_list: 'inner', index: 22, }, },
        { a: { spring_list: 'inner', index: 22, }, b: { spring_list: 'surface', index: 24, }, },
        { a: { spring_list: 'inner', index: 23, }, b: { spring_list: 'surface', index: 57, }, },
        { a: { spring_list: 'inner', index: 24, }, b: { spring_list: 'surface', index: 56, }, },
        { a: { spring_list: 'inner', index: 25, }, b: { spring_list: 'surface', index: 55, }, },
        { a: { spring_list: 'inner', index: 26, }, b: { spring_list: 'surface', index: 54, }, },
        { a: { spring_list: 'surface', index: 32, }, b: { spring_list: 'inner', index: 26, }, },
        { a: { spring_list: 'surface', index: 31, }, b: { spring_list: 'inner', index: 25, }, },
        { a: { spring_list: 'surface', index: 30, }, b: { spring_list: 'inner', index: 24, }, },
        { a: { spring_list: 'surface', index: 29, }, b: { spring_list: 'inner', index: 23, }, },
        { a: { spring_list: 'surface', index: 63, }, b: { spring_list: 'inner', index: 22, }, },
        { a: { spring_list: 'inner', index: 23, }, b: { spring_list: 'surface', index: 30, }, },
        { a: { spring_list: 'surface', index: 57, }, b: { spring_list: 'inner', index: 24, }, },
        { a: { spring_list: 'inner', index: 24, }, b: { spring_list: 'surface', index: 31, }, },
        { a: { spring_list: 'surface', index: 56, }, b: { spring_list: 'inner', index: 25, }, },
        { a: { spring_list: 'inner', index: 25, }, b: { spring_list: 'surface', index: 32, }, },
        { a: { spring_list: 'surface', index: 55, }, b: { spring_list: 'inner', index: 26, }, },
        { a: { spring_list: 'inner', index: 20, }, b: { spring_list: 'surface', index: 63, }, },
        { a: { spring_list: 'inner', index: 20, }, b: { spring_list: 'surface', index: 23, }, },
        { a: { spring_list: 'surface', index: 23, }, b: { spring_list: 'inner', index: 22, }, },
        { a: { spring_list: 'inner', index: 23, }, b: { spring_list: 'surface', index: 56, }, },
        { a: { spring_list: 'surface', index: 30, }, b: { spring_list: 'inner', index: 25, }, },
        { a: { spring_list: 'inner', index: 25, }, b: { spring_list: 'surface', index: 54, }, },
        { a: { spring_list: 'surface', index: 31, }, b: { spring_list: 'inner', index: 26, }, },
        { a: { spring_list: 'inner', index: 20, }, b: { spring_list: 'surface', index: 62, }, },
        { a: { spring_list: 'inner', index: 20, }, b: { spring_list: 'surface', index: 24, }, },
        { a: { spring_list: 'surface', index: 29, }, b: { spring_list: 'inner', index: 24, }, },
        { a: { spring_list: 'inner', index: 24, }, b: { spring_list: 'surface', index: 55, }, },
        { a: { spring_list: 'inner', index: 26, }, b: { spring_list: 'inner', index: 35, }, },
        { a: { spring_list: 'surface', index: 54, }, b: { spring_list: 'inner', index: 35, }, },
        { a: { spring_list: 'inner', index: 26, }, b: { spring_list: 'surface', index: 53, }, },
        { a: { spring_list: 'surface', index: 32, }, b: { spring_list: 'surface', index: 33, }, },
        { a: { spring_list: 'inner', index: 26, }, b: { spring_list: 'surface', index: 33, }, },
        { a: { spring_list: 'surface', index: 54, }, b: { spring_list: 'surface', index: 53, }, },
        { a: { spring_list: 'surface', index: 32, }, b: { spring_list: 'inner', index: 35, }, },
        { a: { spring_list: 'surface', index: 24, }, b: { spring_list: 'surface', index: 25, }, },
        { a: { spring_list: 'surface', index: 25, }, b: { spring_list: 'surface', index: 26, }, },
        { a: { spring_list: 'surface', index: 26, }, b: { spring_list: 'surface', index: 27, }, },
        { a: { spring_list: 'surface', index: 27, }, b: { spring_list: 'surface', index: 28, }, },
        { a: { spring_list: 'inner', index: 22, }, b: { spring_list: 'inner', index: 27, }, },
        { a: { spring_list: 'inner', index: 27, }, b: { spring_list: 'inner', index: 28, }, },
        { a: { spring_list: 'inner', index: 28, }, b: { spring_list: 'inner', index: 29, }, },
        { a: { spring_list: 'inner', index: 29, }, b: { spring_list: 'inner', index: 30, }, },
        { a: { spring_list: 'surface', index: 62, }, b: { spring_list: 'surface', index: 61, }, },
        { a: { spring_list: 'surface', index: 61, }, b: { spring_list: 'surface', index: 60, }, },
        { a: { spring_list: 'surface', index: 60, }, b: { spring_list: 'surface', index: 59, }, },
        { a: { spring_list: 'surface', index: 59, }, b: { spring_list: 'surface', index: 58, }, },
        { a: { spring_list: 'inner', index: 27, }, b: { spring_list: 'surface', index: 61, }, },
        { a: { spring_list: 'surface', index: 25, }, b: { spring_list: 'inner', index: 27, }, },
        { a: { spring_list: 'surface', index: 26, }, b: { spring_list: 'inner', index: 28, }, },
        { a: { spring_list: 'inner', index: 28, }, b: { spring_list: 'surface', index: 60, }, },
        { a: { spring_list: 'inner', index: 29, }, b: { spring_list: 'surface', index: 59, }, },
        { a: { spring_list: 'surface', index: 27, }, b: { spring_list: 'inner', index: 29, }, },
        { a: { spring_list: 'surface', index: 28, }, b: { spring_list: 'inner', index: 30, }, },
        { a: { spring_list: 'inner', index: 30, }, b: { spring_list: 'surface', index: 58, }, },
        { a: { spring_list: 'surface', index: 24, }, b: { spring_list: 'inner', index: 27, }, },
        { a: { spring_list: 'inner', index: 27, }, b: { spring_list: 'surface', index: 60, }, },
        { a: { spring_list: 'surface', index: 25, }, b: { spring_list: 'inner', index: 28, }, },
        { a: { spring_list: 'inner', index: 28, }, b: { spring_list: 'surface', index: 59, }, },
        { a: { spring_list: 'surface', index: 26, }, b: { spring_list: 'inner', index: 29, }, },
        { a: { spring_list: 'inner', index: 29, }, b: { spring_list: 'surface', index: 58, }, },
        { a: { spring_list: 'surface', index: 27, }, b: { spring_list: 'inner', index: 30, }, },
        { a: { spring_list: 'inner', index: 30, }, b: { spring_list: 'surface', index: 57, }, },
        { a: { spring_list: 'inner', index: 23, }, b: { spring_list: 'surface', index: 28, }, },
        { a: { spring_list: 'inner', index: 22, }, b: { spring_list: 'surface', index: 61, }, },
        { a: { spring_list: 'inner', index: 22, }, b: { spring_list: 'surface', index: 25, }, },
        { a: { spring_list: 'inner', index: 23, }, b: { spring_list: 'surface', index: 58, }, },
        { a: { spring_list: 'surface', index: 62, }, b: { spring_list: 'inner', index: 27, }, },
        { a: { spring_list: 'inner', index: 27, }, b: { spring_list: 'surface', index: 26, }, },
        { a: { spring_list: 'surface', index: 61, }, b: { spring_list: 'inner', index: 28, }, },
        { a: { spring_list: 'inner', index: 28, }, b: { spring_list: 'surface', index: 27, }, },
        { a: { spring_list: 'surface', index: 60, }, b: { spring_list: 'inner', index: 29, }, },
        { a: { spring_list: 'inner', index: 29, }, b: { spring_list: 'surface', index: 28, }, },
        { a: { spring_list: 'surface', index: 59, }, b: { spring_list: 'inner', index: 30, }, },
        { a: { spring_list: 'inner', index: 30, }, b: { spring_list: 'surface', index: 29, }, },
        { a: { spring_list: 'surface', index: 36, }, b: { spring_list: 'surface', index: 37, }, },
        { a: { spring_list: 'inner', index: 38, }, b: { spring_list: 'inner', index: 31, }, },
        { a: { spring_list: 'surface', index: 50, }, b: { spring_list: 'surface', index: 49, }, },
        { a: { spring_list: 'surface', index: 37, }, b: { spring_list: 'surface', index: 38, }, },
        { a: { spring_list: 'inner', index: 31, }, b: { spring_list: 'inner', index: 32, }, },
        { a: { spring_list: 'surface', index: 49, }, b: { spring_list: 'surface', index: 48, }, },
        { a: { spring_list: 'surface', index: 38, }, b: { spring_list: 'surface', index: 39, }, },
        { a: { spring_list: 'inner', index: 32, }, b: { spring_list: 'inner', index: 33, }, },
        { a: { spring_list: 'surface', index: 48, }, b: { spring_list: 'surface', index: 47, }, },
        { a: { spring_list: 'surface', index: 39, }, b: { spring_list: 'surface', index: 40, }, },
        { a: { spring_list: 'inner', index: 33, }, b: { spring_list: 'inner', index: 34, }, },
        { a: { spring_list: 'surface', index: 47, }, b: { spring_list: 'surface', index: 46, }, },
        { a: { spring_list: 'inner', index: 34, }, b: { spring_list: 'surface', index: 43, }, },
        { a: { spring_list: 'inner', index: 31, }, b: { spring_list: 'surface', index: 49, }, },
        { a: { spring_list: 'inner', index: 32, }, b: { spring_list: 'surface', index: 48, }, },
        { a: { spring_list: 'inner', index: 33, }, b: { spring_list: 'surface', index: 47, }, },
        { a: { spring_list: 'inner', index: 34, }, b: { spring_list: 'surface', index: 46, }, },
        { a: { spring_list: 'surface', index: 40, }, b: { spring_list: 'inner', index: 34, }, },
        { a: { spring_list: 'surface', index: 39, }, b: { spring_list: 'inner', index: 33, }, },
        { a: { spring_list: 'surface', index: 38, }, b: { spring_list: 'inner', index: 32, }, },
        { a: { spring_list: 'surface', index: 37, }, b: { spring_list: 'inner', index: 31, }, },
        { a: { spring_list: 'inner', index: 31, }, b: { spring_list: 'surface', index: 38, }, },
        { a: { spring_list: 'surface', index: 49, }, b: { spring_list: 'inner', index: 32, }, },
        { a: { spring_list: 'inner', index: 32, }, b: { spring_list: 'surface', index: 39, }, },
        { a: { spring_list: 'surface', index: 48, }, b: { spring_list: 'inner', index: 33, }, },
        { a: { spring_list: 'inner', index: 33, }, b: { spring_list: 'surface', index: 40, }, },
        { a: { spring_list: 'surface', index: 47, }, b: { spring_list: 'inner', index: 34, }, },
        { a: { spring_list: 'inner', index: 31, }, b: { spring_list: 'surface', index: 48, }, },
        { a: { spring_list: 'surface', index: 38, }, b: { spring_list: 'inner', index: 33, }, },
        { a: { spring_list: 'inner', index: 33, }, b: { spring_list: 'surface', index: 46, }, },
        { a: { spring_list: 'surface', index: 39, }, b: { spring_list: 'inner', index: 34, }, },
        { a: { spring_list: 'surface', index: 40, }, b: { spring_list: 'surface', index: 43, }, },
        { a: { spring_list: 'surface', index: 46, }, b: { spring_list: 'surface', index: 43, }, },
        { a: { spring_list: 'surface', index: 37, }, b: { spring_list: 'inner', index: 32, }, },
        { a: { spring_list: 'inner', index: 32, }, b: { spring_list: 'surface', index: 47, }, },
        { a: { spring_list: 'surface', index: 41, }, b: { spring_list: 'surface', index: 42, }, },
        { a: { spring_list: 'surface', index: 45, }, b: { spring_list: 'surface', index: 44, }, },
        { a: { spring_list: 'surface', index: 41, }, b: { spring_list: 'surface', index: 40, }, },
        { a: { spring_list: 'surface', index: 42, }, b: { spring_list: 'surface', index: 43, }, },
        { a: { spring_list: 'surface', index: 45, }, b: { spring_list: 'surface', index: 46, }, },
        { a: { spring_list: 'surface', index: 44, }, b: { spring_list: 'surface', index: 43, }, },
        { a: { spring_list: 'inner', index: 34, }, b: { spring_list: 'surface', index: 45, }, },
        { a: { spring_list: 'inner', index: 34, }, b: { spring_list: 'surface', index: 44, }, },
        { a: { spring_list: 'inner', index: 34, }, b: { spring_list: 'surface', index: 41, }, },
        { a: { spring_list: 'inner', index: 34, }, b: { spring_list: 'surface', index: 42, }, },
        { a: { spring_list: 'surface', index: 33, }, b: { spring_list: 'surface', index: 34, }, },
        { a: { spring_list: 'surface', index: 34, }, b: { spring_list: 'surface', index: 35, }, },
        { a: { spring_list: 'surface', index: 35, }, b: { spring_list: 'surface', index: 36, }, },
        { a: { spring_list: 'inner', index: 35, }, b: { spring_list: 'inner', index: 36, }, },
        { a: { spring_list: 'inner', index: 36, }, b: { spring_list: 'inner', index: 37, }, },
        { a: { spring_list: 'inner', index: 37, }, b: { spring_list: 'inner', index: 38, }, },
        { a: { spring_list: 'surface', index: 53, }, b: { spring_list: 'surface', index: 52, }, },
        { a: { spring_list: 'surface', index: 52, }, b: { spring_list: 'surface', index: 51, }, },
        { a: { spring_list: 'surface', index: 51, }, b: { spring_list: 'surface', index: 50, }, },
        { a: { spring_list: 'inner', index: 35, }, b: { spring_list: 'surface', index: 53, }, },
        { a: { spring_list: 'surface', index: 33, }, b: { spring_list: 'inner', index: 35, }, },
        { a: { spring_list: 'surface', index: 34, }, b: { spring_list: 'inner', index: 36, }, },
        { a: { spring_list: 'inner', index: 36, }, b: { spring_list: 'surface', index: 52, }, },
        { a: { spring_list: 'inner', index: 37, }, b: { spring_list: 'surface', index: 51, }, },
        { a: { spring_list: 'surface', index: 35, }, b: { spring_list: 'inner', index: 37, }, },
        { a: { spring_list: 'surface', index: 36, }, b: { spring_list: 'inner', index: 38, }, },
        { a: { spring_list: 'inner', index: 38, }, b: { spring_list: 'surface', index: 50, }, },
        { a: { spring_list: 'inner', index: 35, }, b: { spring_list: 'surface', index: 52, }, },
        { a: { spring_list: 'surface', index: 33, }, b: { spring_list: 'inner', index: 36, }, },
        { a: { spring_list: 'inner', index: 36, }, b: { spring_list: 'surface', index: 51, }, },
        { a: { spring_list: 'surface', index: 34, }, b: { spring_list: 'inner', index: 37, }, },
        { a: { spring_list: 'inner', index: 37, }, b: { spring_list: 'surface', index: 50, }, },
        { a: { spring_list: 'surface', index: 35, }, b: { spring_list: 'inner', index: 38, }, },
        { a: { spring_list: 'inner', index: 38, }, b: { spring_list: 'surface', index: 49, }, },
        { a: { spring_list: 'inner', index: 31, }, b: { spring_list: 'surface', index: 36, }, },
        { a: { spring_list: 'inner', index: 31, }, b: { spring_list: 'surface', index: 50, }, },
        { a: { spring_list: 'inner', index: 35, }, b: { spring_list: 'surface', index: 34, }, },
        { a: { spring_list: 'surface', index: 53, }, b: { spring_list: 'inner', index: 36, }, },
        { a: { spring_list: 'inner', index: 36, }, b: { spring_list: 'surface', index: 35, }, },
        { a: { spring_list: 'surface', index: 52, }, b: { spring_list: 'inner', index: 37, }, },
        { a: { spring_list: 'inner', index: 37, }, b: { spring_list: 'surface', index: 36, }, },
        { a: { spring_list: 'surface', index: 51, }, b: { spring_list: 'inner', index: 38, }, },
        { a: { spring_list: 'inner', index: 38, }, b: { spring_list: 'surface', index: 37, }, },
        { a: { spring_list: 'surface', index: 66, }, b: { spring_list: 'inner', index: 19, }, },
        { a: { spring_list: 'surface', index: 20, }, b: { spring_list: 'inner', index: 19, }, },
        { a: { spring_list: 'inner', index: 14, }, b: { spring_list: 'surface', index: 21, }, },
        { a: { spring_list: 'inner', index: 21, }, b: { spring_list: 'surface', index: 21, }, },
        { a: { spring_list: 'inner', index: 14, }, b: { spring_list: 'inner', index: 19, }, },
    ]
    
    
    
    const generated_frame_results = generate_frame_segements_for_rectangles(40, 2, 5, false);
    const frame_indices_segment_collection = generated_frame_results[0];
    const is_frame_fixed_collection = generated_frame_results[1];

    is_frame_fixed_collection[0] = true
    is_frame_fixed_collection[is_frame_fixed_collection.length-1] = true


    const shape = general_shape(globals, 100, inner_point_list, surface_point_list, spring_data_list, frame_indices_segment_collection, is_frame_fixed_collection, .2)
    shape.type = "40";
    return shape;
}


export function make_cannon_ball(globals) {

    const inner_point_list = [
    ]
    
    const surface_point_list = [
        {	x: -0.3536,	 y: -0.3536	},
        {	x: -0.4619,	 y: -0.1913	},
        {	x: -0.5,	 y: -0		},
        {	x: -0.4619,	 y: 0.1913	},
        {	x: -0.3536,	 y: 0.3536	},
        {	x: -0.1913,	 y: 0.4619	},
        {	x: 0,		 y: 0.5		},
        {	x: 0.1913,	 y: 0.4619	},
        {	x: 0.3536,	 y: 0.3536	},
        {	x: 0.4619,	 y: 0.1913	},
        {	x: 0.5,		 y: -0		},
        {	x: 0.4619,	 y: -0.1913	},
        {	x: 0.3536,	 y: -0.3536	},
        {	x: 0.1913,	 y: -0.4619	},
        {	x: 0,		 y: -0.5	},
        {	x: -0.1913,	 y: -0.4619	},
    ]
    
    const spring_data_list = [
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'surface', index: 6, }, },
        { a: { spring_list: 'surface', index: 4, }, b: { spring_list: 'surface', index: 5, }, },
        { a: { spring_list: 'surface', index: 3, }, b: { spring_list: 'surface', index: 4, }, },
        { a: { spring_list: 'surface', index: 2, }, b: { spring_list: 'surface', index: 3, }, },
        { a: { spring_list: 'surface', index: 1, }, b: { spring_list: 'surface', index: 2, }, },
        { a: { spring_list: 'surface', index: 0, }, b: { spring_list: 'surface', index: 1, }, },
        { a: { spring_list: 'surface', index: 15, }, b: { spring_list: 'surface', index: 0, }, },
        { a: { spring_list: 'surface', index: 14, }, b: { spring_list: 'surface', index: 15, }, },
        { a: { spring_list: 'surface', index: 13, }, b: { spring_list: 'surface', index: 14, }, },
        { a: { spring_list: 'surface', index: 12, }, b: { spring_list: 'surface', index: 13, }, },
        { a: { spring_list: 'surface', index: 11, }, b: { spring_list: 'surface', index: 12, }, },
        { a: { spring_list: 'surface', index: 10, }, b: { spring_list: 'surface', index: 11, }, },
        { a: { spring_list: 'surface', index: 9, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'surface', index: 8, }, b: { spring_list: 'surface', index: 9, }, },
        { a: { spring_list: 'surface', index: 7, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'surface', index: 7, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'surface', index: 2, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'surface', index: 3, }, },
        { a: { spring_list: 'surface', index: 4, }, b: { spring_list: 'surface', index: 7, }, },
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'surface', index: 9, }, },
        { a: { spring_list: 'surface', index: 10, }, b: { spring_list: 'surface', index: 7, }, },
        { a: { spring_list: 'surface', index: 11, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'surface', index: 12, }, b: { spring_list: 'surface', index: 9, }, },
        { a: { spring_list: 'surface', index: 13, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'surface', index: 14, }, b: { spring_list: 'surface', index: 11, }, },
        { a: { spring_list: 'surface', index: 15, }, b: { spring_list: 'surface', index: 12, }, },
        { a: { spring_list: 'surface', index: 0, }, b: { spring_list: 'surface', index: 13, }, },
        { a: { spring_list: 'surface', index: 1, }, b: { spring_list: 'surface', index: 14, }, },
        { a: { spring_list: 'surface', index: 2, }, b: { spring_list: 'surface', index: 15, }, },
        { a: { spring_list: 'surface', index: 3, }, b: { spring_list: 'surface', index: 0, }, },
        { a: { spring_list: 'surface', index: 4, }, b: { spring_list: 'surface', index: 1, }, },
        { a: { spring_list: 'surface', index: 11, }, b: { spring_list: 'surface', index: 7, }, },
        { a: { spring_list: 'surface', index: 12, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'surface', index: 9, }, },
        { a: { spring_list: 'surface', index: 4, }, b: { spring_list: 'surface', index: 8, }, },
        { a: { spring_list: 'surface', index: 13, }, b: { spring_list: 'surface', index: 9, }, },
        { a: { spring_list: 'surface', index: 14, }, b: { spring_list: 'surface', index: 10, }, },
        { a: { spring_list: 'surface', index: 15, }, b: { spring_list: 'surface', index: 11, }, },
        { a: { spring_list: 'surface', index: 0, }, b: { spring_list: 'surface', index: 12, }, },
        { a: { spring_list: 'surface', index: 1, }, b: { spring_list: 'surface', index: 13, }, },
        { a: { spring_list: 'surface', index: 2, }, b: { spring_list: 'surface', index: 14, }, },
        { a: { spring_list: 'surface', index: 3, }, b: { spring_list: 'surface', index: 15, }, },
        { a: { spring_list: 'surface', index: 4, }, b: { spring_list: 'surface', index: 0, }, },
        { a: { spring_list: 'surface', index: 5, }, b: { spring_list: 'surface', index: 1, }, },
        { a: { spring_list: 'surface', index: 6, }, b: { spring_list: 'surface', index: 2, }, },
        { a: { spring_list: 'surface', index: 3, }, b: { spring_list: 'surface', index: 7, }, },
    ]
    
    
    const frame_index_lists_collection = [];
    for (let i = 0; i < surface_point_list.length; i++) {
        frame_index_lists_collection.push(i);

    }

    const shape = general_shape(globals, 100, inner_point_list, surface_point_list, spring_data_list, [frame_index_lists_collection], [false], .2)
    return shape;
}