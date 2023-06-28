export interface OcrResult {

	boundingBox: BoundingBox,
	text: string,
	score: number,
}

export interface BoundingBox {

	width: number,
	height: number,
	corners: Point[]
}

export interface Point {
	x: number,
	y: number
}
