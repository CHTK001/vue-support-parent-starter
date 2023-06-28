import request from '@/utils/request';
import {AxiosPromise} from 'axios';
import Global from "@/config/global";
import {OcrResult} from "@/api/ocr/types";

/**
 * ocr识别
 *
 */
export function ocr(): AxiosPromise<OcrResult> {
	return request({
		url: Global.HOST + '/api/v1/ocr',
		method: 'post',
	});
}
