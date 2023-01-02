
export let ICONS = {
  LOCATION: 'location',
  CIRCLE: 'circle',
  CIRCLE_EMPTY: 'circle_empty',
  HEXAGON: 'hexagon',
  HEXAGON_EMPTY: 'hexagon_empty',
  PLUS: 'plus',
  PARKING: 'parking',
  SQUARE: 'square',
  SQUARE_EMPTY: 'square_empty',
  TRIANGLE: 'triangle',
  TRIANGLE_EMPTY: 'triangle_empty',
  ATM: 'atm',
  BIKE: 'bike',
  BUS: 'bus',
  PETROL: 'petrol',
  PLACE: 'place',
  POINT: 'point'
};
export const ICONS_CURZON = {
  BRIDGE: 'bridge',
  FENCING: 'fencing',
  FISH: 'fish',
  HOUSE: 'house',
  INFO: 'info',
  LIGHTNING: 'lightning',
  MOVIE: 'movie',
  STAR: 'star',
  SURFING: 'surfing',
  TOWER: 'tower',
  VISTAHALF: 'vistahalf',
  WAITINGROOM: 'waitingroom',
  WALKING: 'walking',
  ENVELOPE_SQUARE: 'envelope_square',
  ENVELOPE_SQUARE_1: 'envelope_square_1',
  EXCLUDED_SQUARE: 'excluded_square',
  OPEN_SQUARE: 'open_square',
  OUTREACH_SQUARE: 'outreach_square',
  PARKING_SQUARE: 'parking_square',
  REJECTED_CIRCLE: 'rejected_circle',
  BANK: 'bank',
  POSTBOX: 'postbox'
}

export const ICONS_LINE = {
  LINE_SOLID: 'line_solid',
  LINE_DASHED: 'line_dashed'
};

export const ICONS_VIEWBOX = {
  bank: '0 0 47.001 47.001',
  postbox: '0 0 44 60'
}

// take SVG paths from 'src/assets/icons/map-{id}.svg' center them to top left corner
export const ICONS_PATH: { [nam: string]: string } = {
  location: 'M20,12c0,4.4-3.6,8-8,8s-8-3.6-8-8s3.6-8,8-8S20,7.6,20,12z M12,6c-3.3,0-6,2.7-6,6s2.7,6,6,6s6-2.7,6-6S15.3,6,12,6zM16,12c0,2.2-1.8,4-4,4s-4-1.8-4-4s1.8-4,4-4S16,9.8,16,12z',
  circle: 'M20,12c0,4.4-3.6,8-8,8s-8-3.6-8-8s3.6-8,8-8S20,7.6,20,12z',
  circle_empty: 'M20,12c0,4.4-3.6,8-8,8s-8-3.6-8-8s3.6-8,8-8S20,7.6,20,12z M12,7c-2.8,0-5,2.2-5,5s2.2,5,5,5s5-2.2,5-5S14.8,7,12,7z',
  hexagon: 'M16,5.1L8 5.1 4 12 8 18.9 16 18.9 20 12z',
  hexagon_empty: 'M16,5.1H8L4,12l4,6.9h8l4-6.9L16,5.1z M15,17.2H9L6,12l3-5.2h6l3,5.2L15,17.2z',
  plus: 'M14,4L10 4 10 10 4 10 4 14 10 14 10 20 14 20 14 14 20 14 20 10 14 10z',
  parking: `M18.3,6.5c-0.3-0.7-0.8-1.2-1.4-1.6c-0.6-0.4-1.2-0.6-2-0.8C14.3,4,13.6,4,12.5,4H6.8C6.6,4,6.4,4.2,6.4,4.4v15.2
	c0,0.2,0.2,0.4,0.4,0.4h2c0.2,0,0.4-0.2,0.4-0.4v-5.8h3.5c2.3,0,3.8-0.5,4.8-1.5c0.9-1,1.3-2.2,1.3-3.6C18.8,8,18.6,7.2,18.3,6.5
	L18.3,6.5z M12.7,11.2H9.2V6.6h3.5c1.1,0,1.6,0.1,1.8,0.1c0.4,0.1,0.8,0.4,1,0.7c0.3,0.4,0.4,0.8,0.4,1.4c0,0.8-0.2,1.3-0.7,1.7
	C14.7,11,13.9,11.2,12.7,11.2L12.7,11.2z`,
  square: `M3 3h18v18h-18z`,
  square_empty: `M17,7v10H7V7H17 M20,4H4v16h16V4L20,4z`,
  triangle: `M11,4.5l-8,13h16L11,4.5L11,4.5z`,
  triangle_empty: `M11,8.3l4.4,7.2H6.6L11,8.3 M11,4.5l-8,13h16L11,4.5L11,4.5z`,
  atm: `M11.2,16h1.6v-0.8h0.8c0.4,0,0.8-0.4,0.8-0.8V12c0-0.4-0.4-0.8-0.8-0.8h-2.4v-0.8h3.2V8.8h-1.6V8h-1.6v0.8h-0.8
	c-0.4,0-0.8,0.4-0.8,0.8V12c0,0.4,0.4,0.8,0.8,0.8h2.4v0.8H9.6v1.6h1.6V16z M18.4,5.6H5.6C4.7,5.6,4,6.3,4,7.2l0,9.6
	c0,0.9,0.7,1.6,1.6,1.6h12.8c0.9,0,1.6-0.7,1.6-1.6V7.2C20,6.3,19.3,5.6,18.4,5.6z M18.4,16.8H5.6V7.2h12.8V16.8z`,
  bike: `M14.3,7.6c0.7,0,1.3-0.6,1.3-1.3s-0.6-1.3-1.3-1.3S13,5.5,13,6.3S13.6,7.6,14.3,7.6z M7.3,11.9c-1.9,0-3.3,1.5-3.3,3.3
	c0,1.9,1.5,3.3,3.3,3.3s3.3-1.5,3.3-3.3S9.2,11.9,7.3,11.9z M7.3,17.6c-1.3,0-2.3-1.1-2.3-2.3s1.1-2.3,2.3-2.3s2.3,1.1,2.3,2.3
	S8.6,17.6,7.3,17.6z M11.2,10.9l1.6-1.6l0.5,0.5c0.9,0.9,2,1.4,3.4,1.4V9.9c-1,0-1.8-0.4-2.4-1l-1.3-1.3c-0.3-0.3-0.7-0.4-1.1-0.4
	s-0.7,0.1-0.9,0.4L9.2,9.5c-0.3,0.3-0.4,0.6-0.4,0.9c0,0.4,0.1,0.7,0.4,0.9l2.1,1.9v3.3h1.3v-4.1L11.2,10.9z M16.7,11.9
	c-1.9,0-3.3,1.5-3.3,3.3c0,1.9,1.5,3.3,3.3,3.3s3.3-1.5,3.3-3.3S18.5,11.9,16.7,11.9z M16.7,17.6c-1.3,0-2.3-1.1-2.3-2.3
	s1.1-2.3,2.3-2.3S19,14,19,15.2S17.9,17.6,16.7,17.6z`,
  bus: `M5.3,15.3c0,0.7,0.3,1.4,0.8,1.9v1.5c0,0.5,0.4,0.8,0.8,0.8h0.8c0.5,0,0.8-0.4,0.8-0.8v-0.8h6.7v0.8c0,0.5,0.4,0.8,0.8,0.8
	h0.8c0.5,0,0.8-0.4,0.8-0.8v-1.5c0.5-0.5,0.8-1.1,0.8-1.9V6.9c0-2.9-3-3.4-6.7-3.4S5.3,3.9,5.3,6.9V15.3z M8.2,16.1
	c-0.7,0-1.3-0.6-1.3-1.3s0.6-1.3,1.3-1.3s1.3,0.6,1.3,1.3S8.9,16.1,8.2,16.1z M15.8,16.1c-0.7,0-1.3-0.6-1.3-1.3s0.6-1.3,1.3-1.3
	s1.3,0.6,1.3,1.3S16.5,16.1,15.8,16.1z M17.1,11.1H6.9V6.9h10.1V11.1z`,
  petrol: `M18.9,7.8L18.9,7.8l-3.3-3.3l-0.9,0.9l1.9,1.9c-0.8,0.3-1.4,1.1-1.4,2.1c0,1.2,1,2.2,2.2,2.2c0.3,0,0.6-0.1,0.9-0.2v6.4
	c0,0.5-0.4,0.9-0.9,0.9s-0.9-0.4-0.9-0.9v-4c0-1-0.8-1.8-1.8-1.8h-0.9V5.8C13.8,4.8,13,4,12,4H6.7c-1,0-1.8,0.8-1.8,1.8V20h8.9v-6.7
	h1.3v4.4c0,1.2,1,2.2,2.2,2.2s2.2-1,2.2-2.2V9.3C19.6,8.7,19.3,8.2,18.9,7.8z M12,10.2H6.7V5.8H12V10.2z M17.4,10.2
	c-0.5,0-0.9-0.4-0.9-0.9c0-0.5,0.4-0.9,0.9-0.9s0.9,0.4,0.9,0.9C18.3,9.8,17.8,10.2,17.4,10.2z`,
  line_solid: `M992 544 32 544c-17.664 0-32-14.304-32-32 0-17.664 14.336-32 32-32l960 0c17.696 0 32 14.336 32 32C1024 529.696 1009.696 544 992 544z`,
  line_dashed: `M234.666667 490.666667h-153.6a25.6 25.6 0 1 0 0 51.2h153.6a25.6 25.6 0 1 0 0-51.2zM473.6 490.666667h-153.6a25.6 25.6 0 1 0 0 51.2h153.6a25.6 25.6 0 1 0 0-51.2zM934.4 490.666667h-136.533333a25.6 25.6 0 1 0 0 51.2h136.533333a25.6 25.6 0 1 0 0-51.2zM712.533333 490.666667h-153.6a25.6 25.6 0 1 0 0 51.2h153.6a25.6 25.6 0 1 0 0-51.2z`,
  place: `M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z`
};

export const ICONS_SVG: { [nam: string]: string } = {
  bridge: `<style type="text/css">
  .svg-icon__fill-white{fill: rgba(255,255,255,1);}
  .svg-icon__stroke-white{stroke: rgba(255,255,255,1);}
  .svg-icon__fill-none{fill: none;}
  </style>
  <circle cx="12" cy="12" r="8"/>
  <g>
    <rect class="svg-icon__fill-white" x="8.4" y="7.9" width="1.4" height="8"/>
    <rect class="svg-icon__fill-white" x="14.2" y="7.9" width="1.4" height="8"/>
    <rect class="svg-icon__fill-white" x="7.6" y="11.7" width="8.8" height="1.4"/>
    <rect class="svg-icon__fill-white" x="7.6" y="14.5" width="3" height="1.4"/>
    <rect class="svg-icon__fill-white" x="13.4" y="14.5" width="3" height="1.4"/>
    <rect class="svg-icon__fill-white" x="10.6" y="7.9" width="0.8" height="3.6"/>
    <rect class="svg-icon__fill-white" x="12.8" y="7.9" width="0.8" height="3.6"/>
    <path class="svg-icon__fill-none svg-icon__stroke-white" d="M8.9,8.4c0.4,1.2,1.6,2.2,3.1,2.2s2.6-1,3.1-2.2"/>
  </g>
`,
  fencing: `<style type="text/css">
	.svg-icon__fill-white{fill: rgba(255,255,255,1);}
</style>
<g>
	<circle cx="12" cy="12" r="8"/>
	<g>
		<polygon class="svg-icon__fill-white" points="15.2,7.8 12,11 8.7,7.7 8.7,8.8 11.5,11.7 9.7,13.4 7.8,13.4 10.2,16.1 10.2,13.8 15.2,8.8 		"/>
		<polygon class="svg-icon__fill-white" points="16.3,13.4 14.4,13.4 12.8,11.9 12.3,12.3 13.9,13.9 13.9,15.8 		"/>
		<rect class="svg-icon__fill-white" x="15.5" y="14.6" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -6.3007 15.7064)" width="0.5" height="1.6"/>
		<rect class="svg-icon__fill-white" x="7.4" y="15.2" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -8.5085 10.3338)" width="1.6" height="0.5"/>
	</g>
</g>`,
  fish: `<style type="text/css">
  .svg-icon__fill-white{fill: rgba(255,255,255,1);}
</style>
<circle cx="12" cy="12" r="8"/>
<path class="svg-icon__fill-white" d="M14.5,11.9c-1.5-1.9-2.9-2.6-4.9-2c-1.1,0.3-2.6,1.7-2.7,2.3c-0.1,0.7,1.6,2,2.7,2.4c1.9,0.4,3.4-0.1,4.7-2
	c0.3,0.9,0.8,1.6,1.9,1.7c0-1.2,0-2.5,0-3.7C15.4,10.3,14.8,11,14.5,11.9z"/>
<circle cx="7.9" cy="12.1" r="0.3"/>`,
  house: `<style type="text/css">
	.svg-icon__fill-white{fill: rgba(255,255,255,1);}
</style>
<circle cx="12" cy="12" r="8"/>
<path class="svg-icon__fill-white" d="M12,8.2c1.4,1.4,3,2.7,4.5,4.2c-0.5,0-0.9,0.1-1.4,0.1c0,1.2,0,2.3,0,3.5c-0.8,0-1.4,0-2.2,0c0-0.9,0-1.8,0-2.6
	c-0.7,0-1.2,0-1.9,0c0,0.9,0,1.8,0,2.7c-0.8,0-1.4,0-2.1,0c0-1.2,0-2.3,0-3.5c-0.4,0-0.9,0-1.5,0C9,10.8,10.6,9.5,12,8.2z"/>`,
  info: `<style type="text/css">
	.svg-icon__fill-white{fill: rgba(255,255,255,1);}
</style>
<circle cx="12" cy="12" r="8"/>
<g>
	<path class="svg-icon__fill-white" d="M16.7,12c0,2.5-2.1,4.7-4.7,4.7S7.3,14.6,7.3,12c0-2.5,2.1-4.7,4.7-4.7C14.6,7.3,16.7,9.5,16.7,12z M12.5,14.5
		c0-1.2,0-2.3,0-3.3c-0.4,0-0.8,0-1.2,0c0,1.1,0,2.2,0,3.3C11.8,14.5,12.1,14.5,12.5,14.5z M12.5,10.2c0-0.4,0-0.8,0-1.2
		c-0.4,0-0.8,0-1.2,0c0,0.4,0,0.8,0,1.2C11.9,10.2,12.1,10.2,12.5,10.2z"/>
	<path d="M12.5,14.5c-0.4,0-0.8,0-1.2,0c0-1.1,0-2.2,0-3.3c0.3,0,0.8,0,1.2,0C12.5,12.3,12.5,13.4,12.5,14.5z"/>
	<path d="M12.5,10.2c-0.4,0-0.8,0-1.2,0c0-0.3,0-0.8,0-1.2c0.3,0,0.8,0,1.2,0C12.5,9.5,12.5,9.8,12.5,10.2z"/>
</g>`,
  lightning: `<style type="text/css">
  .svg-icon__fill-white{fill: rgba(255,255,255,1);}
</style>
<circle cx="12" cy="12" r="8"/>
<polygon class="svg-icon__fill-white" points="16.4,10.9 12.3,10.9 15.6,7.6 12.8,7.6 11.5,7.6 7.6,12.8 8.4,12.8 8.9,12.8 11.2,12.8 8.4,16.4 "/>
`,
  movie: `<style type="text/css">
  .svg-icon__fill-white{fill: rgba(255,255,255,1);}
</style>
<circle cx="12" cy="12" r="8"/>
<path class="svg-icon__fill-white" d="M14.5,7.3v0.8h-0.8V7.3h-3.6v0.8H9.5V7.3H7.9v9.5h1.4v-0.8h0.8v0.8h3.6v-0.8h0.8v0.8h1.4V7.3H14.5z M10.1,14.5H9.5v-0.8h0.8
	v0.8H10.1z M10.1,12.3H9.5v-0.8h0.8v0.8H10.1z M10.1,10.1H9.5V9.5h0.8v0.7H10.1z M14.5,14.5h-0.8v-0.8h0.8V14.5z M14.5,12.3h-0.8
	v-0.8h0.8V12.3z M14.5,10.1h-0.8V9.5h0.8V10.1z"/>`,
  star: `<style type="text/css">
	.svg-icon__fill-white{fill: rgba(255,255,255,1);}
</style>
<circle cx="12" cy="12" r="8"/>
<polygon class="svg-icon__fill-white" points="12,7.9 13.3,10.6 16.2,11 14.1,13.1 14.5,16.1 12,14.6 9.5,16.1 9.9,13.1 7.8,11 10.7,10.6 "/>
`,
  surfing: `<style type="text/css">
	.svg-icon__fill-white{fill: rgba(255,255,255,1);}
</style>
<circle cx="12" cy="12" r="8"/>
<g>
	<path class="svg-icon__fill-white" d="M12.3,11.5c1.8,0.3,1.9,1.4,1.6,2.6c-0.1,1.1,0.2,1.6,1.2,2.1c0.4,0.1,0.9,0.4,1.3,0.8c-0.1,0.1-0.1,0.2-0.1,0.3
		c-0.3-0.1-0.5-0.1-0.9-0.3c-1.6-0.8-3.4-1.5-5.2-2.4c-0.7-0.4-1.4-0.5-2.2-0.1c-0.3,0.1-0.7,0.1-1.2,0.3c0.3-0.5,0.7-0.9,0.9-1.2
		c-0.3-0.2-0.5-0.4-0.8-0.7c0-0.1,0.1-0.1,0.1-0.2c0.4,0.1,0.8,0.2,1.1,0.3c0.3,0.1,0.8,0.2,1.2,0.1c1.2-0.1,1.1-0.2,0.9-1.3
		c-0.1-0.3,0.1-0.8,0.3-1.1s0.5-0.5,0.8-0.7c-1-0.8-1.8-1.4-2.6-2.1C9.3,7.7,9.6,7.5,10,7.4c0.2,1,1,1.8,2,1.6
		c1.1-0.1,2,0.3,2.8,0.9c0.7,0.3,1.2,0.8,1.9,1.1c-0.4,0.5-0.5,0.5-1.4,0.1c-0.5-0.3-1.1-0.5-1.6-0.9C13.4,10.5,13,10.8,12.3,11.5z
		 M12.2,12.3c-0.5,0.5-1,1-1.4,1.5c0.8,0.3,1.4,0.7,2.3,1.1C13.3,12.8,13.3,12.8,12.2,12.3z"/>
	<circle class="svg-icon__fill-white" cx="14.3" cy="7.8" r="1"/>
</g>`,
  tower: `<style type="text/css">
  .svg-icon__fill-white{fill: rgba(255,255,255,1);}
</style>
<circle cx="12" cy="12" r="8"/>
<path class="svg-icon__fill-white" d="M14.5,10.6c-0.3,0.1-0.4,0.1-0.8,0.2c0.5,1.9,1,3.6,1.4,5.4c-0.5,0.2-1,0.1-1.2-0.3c-0.5-0.8-1.3-1.4-2-2.3
	c-0.8,0.8-1.3,1.5-2,2.3c-0.5,0.5-0.5,0.5-1.3,0.4c0.4-1.6,0.9-3.2,1.2-4.8c0.1-0.3,0.2-0.5-0.2-0.8c-0.1-0.1-0.1-0.7-0.1-1
	c0-1.3,0.1-1.2,1.2-1.8c1.2-0.5,2.3,0,3.4,0.3c0.1,0.1,0.3,0.3,0.3,0.5C14.5,9.4,14.5,10,14.5,10.6z M10.5,9.9c1.1,0,2.1,0,3.2,0
	c0-0.3,0-0.7,0-1c-1.1,0-2.1,0-3.2,0C10.5,9.2,10.5,9.5,10.5,9.9z M12.1,12.3c0.3-0.3,0.5-0.5,0.8-1c0.3-0.3,0.1-0.7-0.3-0.7
	c-0.5,0-1,0.1-1.5,0.2c0.3,0.3,0.5,0.8,0.8,1.2C11.9,12.2,11.9,12.2,12.1,12.3z M10.2,14.2c0.1,0,0.1,0.1,0.1,0.1
	c0.3-0.4,0.8-0.9,1.2-1.3c-0.3-0.3-0.5-0.5-0.8-0.9C10.6,12.9,10.4,13.5,10.2,14.2z M13.3,12.1c-0.3,0.3-0.5,0.7-0.8,0.9
	c0.3,0.4,0.8,0.9,1.1,1.3c0.1,0,0.1-0.1,0.1-0.1C13.6,13.5,13.4,12.9,13.3,12.1z"/>`,
  vistahalf: `<style type="text/css">
  .svg-icon__fill-white{fill: rgba(255,255,255,1);}
</style>
<circle cx="12" cy="12" r="8"/>
<g>
	<path class="svg-icon__fill-white" d="M10.9,6.3c0.3,1.4,0.5,2.7,0.8,4.2c0,0.1,0.2,0.2,0.3,0.3c0.1-0.1,0.3-0.2,0.3-0.3c0.3-1.3,0.5-2.7,0.8-4.1
		C12.3,6.3,11.7,6.3,10.9,6.3z"/>
	<path class="svg-icon__fill-white" d="M9,7c-0.5,0.5-1.1,1-1.6,1.5c1.2,0.9,2.2,1.8,3.2,2.5c0.1,0.1,0.3,0.1,0.5,0.1c0-0.2,0.1-0.4,0-0.5C10.4,9.4,9.7,8.3,9,7z"
		/>
	<path class="svg-icon__fill-white" d="M16.7,8.5c-0.5-0.5-1.1-1-1.6-1.5c-0.8,1.3-1.4,2.5-2.1,3.6c-0.1,0.1,0,0.3,0,0.5c0.1,0,0.3,0.1,0.5-0.1
		C14.5,10.2,15.5,9.4,16.7,8.5z"/>
	<path class="svg-icon__fill-white" d="M17.5,9.9c-1.4,0.5-2.8,1.1-4.2,1.6c0,0.1,0.1,0.2,0.1,0.3c1.4,0,2.8,0,4.5,0C17.7,11.2,17.6,10.7,17.5,9.9z"/>
	<path class="svg-icon__fill-white" d="M6.2,11.9c1.6,0,3.1,0,4.5,0c0-0.1,0.1-0.2,0.1-0.3c-1.4-0.5-2.7-1-4.2-1.6C6.4,10.7,6.2,11.2,6.2,11.9z"/>
</g>`,
  waitingroom: `<style type="text/css">
	.svg-icon__fill-white{fill: rgba(255,255,255,1);}
</style>
<circle cx="12" cy="12" r="8"/>
<g>
	<path class="svg-icon__fill-white" d="M14.6,16.3L14.6,16.3c-0.3-0.1-0.3-0.3-0.3-0.7l1.5-4.1c0.1-0.3,0.3-0.3,0.7-0.3l0,0c0.3,0.1,0.3,0.3,0.3,0.7l-1.5,4.2
		C15.2,16.3,15,16.5,14.6,16.3z"/>
	<path class="svg-icon__fill-white" d="M11,15.8L11,15.8c0-0.3,0.2-0.5,0.5-0.5H15c0.3,0,0.5,0.2,0.5,0.5l0,0c0,0.3-0.2,0.5-0.5,0.5h-3.4
		C11.2,16.4,11,16.2,11,15.8z"/>
	<path class="svg-icon__fill-white" d="M12.8,14.5L12.8,14.5c-0.5-0.1-1-0.8-0.8-1.3l0.8-2.7c0.1-0.5,0.8-1,1.3-0.8l0,0c0.5,0.1,1,0.8,0.8,1.3l-0.8,2.7
		C14,14.3,13.4,14.7,12.8,14.5z"/>
	<path class="svg-icon__fill-white" d="M7.3,16.2L7.3,16.2c-0.3-0.3-0.3-1,0-1.3l2.2-2.2c0.3-0.3,1-0.3,1.3,0l0,0c0.3,0.3,0.3,1,0,1.3l-2.2,2.2
		C8.3,16.5,7.7,16.5,7.3,16.2z"/>
	<path class="svg-icon__fill-white" d="M9.3,13.4L9.3,13.4c0-0.5,0.5-1.1,1.1-1.1h2.7c0.5,0,1.1,0.5,1.1,1.1l0,0c0,0.5-0.5,1.1-1.1,1.1h-2.7
		C9.7,14.5,9.3,14.1,9.3,13.4z"/>
	<circle class="svg-icon__fill-white" cx="14.3" cy="8.5" r="1"/>
</g>`,
  walking: `<style type="text/css">
	.svg-icon__fill-white{fill: rgba(255,255,255,1);}
</style>
<circle cx="12" cy="12" r="8"/>
<g>
	<path class="svg-icon__fill-white" d="M15,11.5c0,0.2,0,0.4,0.1,0.9c-1-0.4-1.8-0.8-2.5-1.1c-0.3,0.5-0.3,1.2,0.3,1.8c0.1,0.1,0.3,0.3,0.3,0.5c0,1,0,2.1,0,3.2
		c-0.3,0-0.5,0-0.9,0c-0.4-1.1,0.5-2.6-1.1-3.6c-0.3,1.2-0.5,2.3-0.8,3.5c-0.3,0-0.5,0-1,0c0.4-2.1,0.8-4.2,1.2-6.2
		c-1.4,0.1-0.7,1.1-1,1.6c-0.2,0-0.4,0-0.8,0c0-0.5,0-1.2,0-1.6c0-0.2,0.2-0.4,0.3-0.5C9.5,9.7,9.8,9.6,10,9.5
		c1.9-0.8,1.9-0.7,3.1,0.8c0.4,0.4,1.1,0.8,1.6,1.1"/>
	<circle class="svg-icon__fill-white" cx="13" cy="8.4" r="1.1"/>
</g>`,
  envelope_square: `
  <style type="text/css">
	.svg-icon__fill-white{fill: rgba(255,255,255,1);}
</style>
<rect class="svg-icon__fill-white" x="4" y="7.4" width="16" height="9.1"/>
<g>
	<g>
		<path d="M13.8,11.7L13,12.2c-0.6,0.4-1.4,0.4-2,0l-0.7-0.5l-5.7,4.8h15L13.8,11.7z"/>
	</g>
</g>
<g>
	<g>
		<polygon points="14.3,11.5 20,16.3 20,7.6 		"/>
	</g>
</g>
<g>
	<g>
		<path d="M4.6,7.4l5.7,3.7l0,0l0.9,0.6c0.4,0.3,0.9,0.3,1.4,0l0.9-0.6l0,0l5.7-3.7L4.6,7.4L4.6,7.4z"/>
	</g>
</g>
<polygon points="4,7.6 4,16.3 9.7,11.5 "/>`,
  envelope_square_1: `<style type="text/css">
.svg-icon__fill-white{fill: rgba(255,255,255,1);}
.svg-icon__fill {  fill: rgba(51, 51, 51, 1);}
</style>
<rect class="svg-icon__fill-white" x="4" y="7.4" width="16" height="9.1"/>
<g>
	<g>
		<path  class="svg-icon__fill" d="M13.8,11.7L13,12.2c-0.6,0.4-1.4,0.4-2,0l-0.7-0.5l-5.7,4.8h15L13.8,11.7z"/>
	</g>
</g>
<g>
	<g>
		<polygon class="svg-icon__fill" points="14.3,11.5 20,16.3 20,7.6 		"/>
	</g>
</g>
<g>
	<g>
		<path d="M4.6,7.4l5.7,3.7l0,0l0.9,0.6c0.4,0.3,0.9,0.3,1.4,0l0.9-0.6l0,0l5.7-3.7L4.6,7.4L4.6,7.4z"/>
	</g>
</g>
<polygon class="svg-icon__fill" points="4,7.6 4,16.3 9.7,11.5 "/>`,
  excluded_square: `<style type="text/css">
.svg-icon__fill-white{fill: rgba(255,255,255,1);}
</style>
<rect x="4" y="3.9" width="16" height="16"/>
<rect class="svg-icon__fill-white" x="5.4" y="5.4" width="13.2" height="13.2"/>
<polygon points="12,14.4 16.2,18.6 18.6,18.6 18.6,16.2 14.4,12 18.6,7.8 18.6,5.4 16.2,5.4 12,9.6 7.8,5.4 5.4,5.4 5.4,7.8 9.6,12
	5.4,16.2 5.4,18.6 7.8,18.6 "/>`,
  open_square: `<style type="text/css">
.svg-icon__fill-white{fill: rgba(255,255,255,1);}
</style><path d="M4,4v16h16V4H4z M18.6,18.6H5.4V5.4h13.3L18.6,18.6L18.6,18.6z"/>
<rect  class="svg-icon__fill-white" x="5.4" y="5.4" width="13.3" height="13.3"/>
<polygon points="16.4,9.6 15.4,8.8 11.1,13.8 8.5,11.8 7.7,12.9 11.4,15.8 "/>`,
  outreach_square: `<style type="text/css">
  .svg-icon__fill-white{fill: rgba(255,255,255,1);}
  .svg-icon__stroke-miterlimit-10{stroke-miterlimit: 10;}
  .svg-icon__fill-none{fill: none;}
</style>
<rect class="svg-icon__fill-none svg-icon__stroke-miterlimit-10" x="4" y="4" width="16" height="16"/>
<g>
	<g>
		<path d="M19.7,19.7H4.3v-8.4L12,5.7l7.7,5.7V19.7z M5.3,18.8h13.5v-6.9l-6.8-5l-6.7,5V18.8z"/>
	</g>
</g>`,
  parking_square: `<style type="text/css">
.svg-icon__fill-white{fill: rgba(255,255,255,1);}
.svg-icon__stroke-white{stroke: rgba(255,255,255,1);}
.svg-icon__stroke-width-30{stroke-width:30}
</style><rect x="4" y="4" width="16" height="16"/>
<g>
	<path class="svg-icon__fill-white"  d="M10.6,13.2v2.9H8.9V8h3.2c0.6,0,1.1,0.1,1.7,0.3c0.4,0.2,0.8,0.5,1,0.9s0.4,0.8,0.4,1.4c0,0.8-0.3,1.4-0.8,1.9
		c-0.5,0.4-1.3,0.7-2.3,0.7H10.6z M10.6,11.8H12c0.4,0,0.8-0.1,1-0.3s0.3-0.5,0.3-0.9S13.2,9.8,13,9.6s-0.5-0.4-0.9-0.4h-1.5V11.8
		L10.6,11.8z"/>
</g>`,
  rejected_circle: `<style type="text/css">
  .svg-icon__fill-white{fill: rgba(255,255,255,1);}
  .svg-icon__stroke-white{stroke: rgba(255,255,255,1);}
  .svg-icon__stroke-width-30{stroke-width:30;}
  .svg-icon__stroke-miterlimit-10{stroke-miterlimit: 10;}
  .svg-icon__fill-none{fill: none;}
  </style><circle class="svg-icon__fill-white" cx="12" cy="11.7" r="6.7"/>
  <path d="M12,4c-4.4,0-8,3.6-8,8s3.6,8,8,8s8-3.6,8-8S16.4,4,12,4z M6.1,12c0-1.3,0.4-2.5,1.1-3.5l8.2,8.2c-1,0.7-2.2,1.1-3.5,1.1
    C8.8,17.9,6.1,15.2,6.1,12z M16.8,15.3L8.7,7.2c0.9-0.6,2.1-1,3.3-1c3.2,0,5.9,2.6,5.9,5.9C17.9,13.2,17.5,14.4,16.8,15.3z"/>`,
  bank: `<g>
	<g id="Layer_1_78_">
		<g>
			<path d="M44.845,42.718H2.136C0.956,42.718,0,43.674,0,44.855c0,1.179,0.956,2.135,2.136,2.135h42.708     c1.18,0,2.136-0.956,2.136-2.135C46.979,43.674,46.023,42.718,44.845,42.718z"/>
			<path d="M4.805,37.165c-1.18,0-2.136,0.956-2.136,2.136s0.956,2.137,2.136,2.137h37.37c1.18,0,2.136-0.957,2.136-2.137     s-0.956-2.136-2.136-2.136h-0.533V17.945h0.533c0.591,0,1.067-0.478,1.067-1.067s-0.478-1.067-1.067-1.067H4.805     c-0.59,0-1.067,0.478-1.067,1.067s0.478,1.067,1.067,1.067h0.534v19.219H4.805z M37.37,17.945v19.219h-6.406V17.945H37.37z      M26.692,17.945v19.219h-6.406V17.945H26.692z M9.609,17.945h6.406v19.219H9.609V17.945z"/>
			<path d="M2.136,13.891h42.708c0.007,0,0.015,0,0.021,0c1.181,0,2.136-0.956,2.136-2.136c0-0.938-0.604-1.733-1.443-2.021     l-21.19-9.535c-0.557-0.25-1.194-0.25-1.752,0L1.26,9.808c-0.919,0.414-1.424,1.412-1.212,2.396     C0.259,13.188,1.129,13.891,2.136,13.891z"/>
		</g>
	</g>
</g>`,
  postbox: `<g id="Page-1">
  <g id="029---Postbox" transform="translate(-1)">
    <g id="Icons" transform="translate(2,1)">
      <path id="Shape" d="M 17 0 h 8 c 5 0 9 4 9 9 v 1 h -26 v -1 c 0 -5 4 -9 9 -9 z"
         />
      <path id="Shape"
        d="M 25 0 h -3 c 2.4 0 4.7 0.9 6.4 2.6 s 2.6 4 2.6 6.4 v 1 h 3 v -1 c 0 -5 -4 -9 -9 -9 z"
         />
      <rect id="Rectangle-path"  height="4" rx="2" width="30" x="6" y="10" />
      <path id="Shape"
        d="M 34 10 h -3 c 1.1 0 2 0.9 2 2 s -0.9 2 -2 2 h 3 c 1.1 0 2 -0.9 2 -2 s -0.9 -2 -2 -2 z"
        />
      <path id="Rectangle-path" d="M 8 14 h 26 v 39 h -26 z"  />
      <path id="Rectangle-path" d="M 31 14 h 3 v 39 h -3 z"  />
      <path id="Shape"
        d="M 41 58 h -40 c -0.3 0 -0.6 -0.2 -0.8 -0.4 c -0.2 -0.3 -0.2 -0.6 -0.1 -0.9 l 0.9 -2.4 c 0.3 -0.8 1 -1.3 1.9 -1.3 h 36.2 c 0.8 0 1.6 0.5 1.9 1.3 l 0.9 2.4 c 0.1 0.3 0.1 0.7 -0.1 0.9 s -0.5 0.4 -0.8 0.4 z"
        fill="white" />
      <path id="Shape"
        d="M 41.9 56.6 l -0.9 -2.4 c -0.3 -0.8 -1 -1.3 -1.9 -1.3 h -3 c 0.8 0 1.6 0.5 1.9 1.3 l 0.9 2.4 c 0.1 0.3 0.1 0.7 -0.1 0.9 s -0.5 0.4 -0.8 0.4 h 3 c 0.3 0 0.6 -0.2 0.8 -0.4 s 0.2 -0.6 0.1 -0.9 z"
        fill="white" />
      <rect id="Rectangle-path" fill="white" height="6" rx="1" width="18" x="12" y="18" />
      <path id="Shape"
        d="M 29 18 h -3 c 0.6 0 1 0.4 1 1 v 4 c 0 0.6 -0.4 1 -1 1 h 3 c 0.6 0 1 -0.4 1 -1 v -4 c 0 -0.6 -0.4 -1 -1 -1 z"
        fill="white" />
    </g>
    <g id="Icons_copy" fill="rgba(0, 0, 0, 1)">
      <path id="Shape"
        d="M 44.9 57.3 l -0.9 -2.4 c -0.5 -1.1 -1.6 -1.9 -2.8 -1.9 h -4.1 v -37.2 c 1.2 -0.4 2 -1.6 2 -2.8 s -0.8 -2.4 -2 -2.8 v -0.2 c 0 -5.5 -4.5 -10 -10 -10 h -8 c -5.5 0 -10 4.5 -10 10 v 0.2 c -1.2 0.4 -2 1.6 -2 2.8 s 0.8 2.4 2 2.8 v 37.2 h -4.1 c -1.2 0 -2.3 0.7 -2.8 1.9 l -0.9 2.4 c -0.2 0.6 -0.2 1.3 0.2 1.9 c 0.4 0.5 1 0.9 1.7 0.9 h 40 c 0.7 0 1.3 -0.3 1.7 -0.9 c 0.4 -0.5 0.4 -1.2 0.2 -1.9 z m -25.9 -55.3 h 8 c 4.4 0 8 3.6 8 8 h -24 c 0 -4.4 3.6 -8 8 -8 z m -9 10 h 26 c 0.6 0 1 0.4 1 1 s -0.4 1 -1 1 h -26 c -0.6 0 -1 -0.4 -1 -1 s 0.4 -1 1 -1 z m 25 4 v 37 h -24 v -37 z m -32 42 l 0.9 -2.4 c 0.2 -0.4 0.5 -0.6 0.9 -0.6 h 36.2 c 0.4 0 0.8 0.2 0.9 0.6 l 0.9 2.4 z" />
      <path id="Shape"
        d="M 31 18 h -16 c -1.1 0 -2 0.9 -2 2 v 4 c 0 1.1 0.9 2 2 2 h 16 c 1.1 0 2 -0.9 2 -2 v -4 c 0 -1.1 -0.9 -2 -2 -2 z m 0 6 h -16 v -4 h 16 z" />
      <path id="Shape"
        d="M 31 28 h -16 c -1.1 0 -2 0.9 -2 2 v 18 c 0 1.1 0.9 2 2 2 h 16 c 1.1 0 2 -0.9 2 -2 v -18 c 0 -1.1 -0.9 -2 -2 -2 z m 0 20 h -16 v -18 h 16 z" />
    </g>
  </g>
</g>`
}

export function addIconstoICONS(icons: any) {
  ICONS = { ...ICONS, ...icons };
}