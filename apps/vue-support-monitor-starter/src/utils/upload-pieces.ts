///
/// Copyright (c) 2019 Of Him Code Technology Studio
/// Jpom is licensed under Mulan PSL v2.
/// You can use this software according to the terms and conditions of the Mulan PSL v2.
/// You may obtain a copy of Mulan PSL v2 at:
/// 			http://license.coscl.org.cn/MulanPSL2
/// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
/// See the Mulan PSL v2 for more details.
///

import { t } from "@repo/config";
import SparkMD5 from "spark-md5";
import { concurrentExecution } from "@/utils/const";
import { generateShardingId } from "@/api/common";
import { GlobalWindow } from "@/interface/common";

const _window = window as unknown as GlobalWindow;

const uploadFileSliceSize = Number(_window.uploadFileSliceSize === "<uploadFileSliceSize>" ? 1 : _window.uploadFileSliceSize) || 1;
const uploadFileConcurrent = Number(_window.uploadFileConcurrent === "<uploadFileConcurrent>" ? 1 : _window.uploadFileConcurrent) || 1;

interface PiecesPar {
  file: File;
  uploadCallback: Function;
  uploadBeforeAbrot: Function;
  success: Function;
  process: Function;
  error: Function;
  resolveFileProcess: Function;
  resolveFileEnd: Function;
  uploadChunkError?: Function;
  /**
   * 文件切片并发数量控制
   */
  concurrentNum?: number;
}

/**
 * 文件分片上传
 * @params file {File} 文件
 * @params pieceSize {Number} 分片大小 默认3MB
 * @params concurrent {Number} 并发数量 默认2
 * @params process {Function} 进度回调函数
 * @params success {Function} 成功回调函数
 * @params error {Function} 失败回调函数
 */
export const uploadPieces = ({ file, uploadCallback, uploadBeforeAbrot, success, process, error, resolveFileProcess, resolveFileEnd, uploadChunkError, concurrentNum = uploadFileConcurrent }: PiecesPar) => {
  // 如果文件传入为空直接 return 返回
  if (!file || file.length < 1) {
    return error(t("i18n_6e69656ffb"));
  }
  if (!window.FileReader) {
    return error(t("i18n_a050cbc36d"));
  }
  let fileMd5: string = ""; //
  let sliceId: string = "";
  const chunkSize: number = uploadFileSliceSize * 1024 * 1024; // 1MB一片
  const chunkCount: number = Math.ceil(file.size / chunkSize); // 总片数
  const chunkList: number[] = []; // 分片列表
  const uploaded: number[] = []; // 已经上传的
  let total: number = 0;
  const blobSlice = (File.prototype as any).slice || (File.prototype as any).mozSlice || (File.prototype as any).webkitSlice;

  /***
   * 获取md5
   **/
  const readFileMd5 = () => {
    //
    // Vue.prototype.$setLoading({
    //   spinning: true,
    //   tip: '解析文件,准备上传中',
    // })
    const reader = new FileReader();
    const spark = new SparkMD5.ArrayBuffer();
    let start = 0;
    total = file.size;
    // 默认 2M 解析缓存
    const batch = 1024 * 1024 * 2;
    const asyncUpdate = function () {
      if (start < total) {
        resolveFileProcess && resolveFileProcess(t("i18n_6a8402afcb") + ((start / total) * 100).toFixed(2) + "%");
        const end = Math.min(start + batch, total);
        reader.readAsArrayBuffer(blobSlice.call(file, start, end));
        start = end;
      } else {
        // 解析结束
        fileMd5 = spark.end();
        // 释放缓存
        spark.destroy();
        // Vue.prototype.$setLoading('closeAll')
        // 判断是否需要继续
        if (uploadBeforeAbrot) {
          uploadBeforeAbrot(fileMd5).then(() => {
            startUpload();
          });
        } else {
          startUpload();
        }
      }
    };
    const startUpload = () => {
      for (let i = 0; i < chunkCount; i++) {
        chunkList.push(Number(i));
      }

      //生成分片 id
      generateShardingId().then((res) => {
        if (res.code === 200) {
          sliceId = res.data;
          concurrentUpload();
        } else {
          error(t("i18n_695344279b") + res.msg);
        }
      });
    };
    reader.onload = function (event) {
      try {
        spark.append(event.target?.result);
        asyncUpdate();
      } catch (e) {
        // Vue.prototype.$setLoading('closeAll')
        error(t("i18n_fb5bc565f3") + e);
      }
    };
    asyncUpdate();
  };

  interface IChunkInfo {
    chunk: Blob;
    start: number;
    end: number;
  }

  interface IChunkInfo2 {
    chunkCount: number;
    chunk: Blob;
    currentChunk: number;
  }

  /***
   * 获取每一个分片的详情
   **/
  const getChunkInfo = (file: File, currentChunk: number, chunkSize: number): IChunkInfo => {
    const start: number = currentChunk * chunkSize;
    const end: number = Math.min(file.size, start + chunkSize);
    const chunk: Blob = blobSlice.call(file, start, end);
    return {
      start,
      end,
      chunk,
    };
  };
  /***
   * 并发上传
   **/
  const concurrentUpload = () => {
    resolveFileEnd && resolveFileEnd();
    const startTime: number = new Date().getTime();
    // 设置初始化进度（避免第一份分片卡顿）
    process(0.01, 1, total, new Date().getTime() - startTime);
    concurrentExecution(chunkList, concurrentNum, (curItem) => {
      return new Promise((resolve, reject) => {
        const { chunk } = getChunkInfo(file, curItem, chunkSize);
        const chunkInfo: IChunkInfo2 = {
          chunk,
          currentChunk: curItem,
          chunkCount,
        };

        // 构建上传文件的formData
        const uploadData: FormData = createUploadData(chunkInfo);

        uploadCallback(uploadData)
          .then(() => {
            uploaded.push(chunkInfo.currentChunk + 1);
            const sd = parseInt(String((uploaded.length / chunkInfo.chunkCount) * 100));
            // console.log(chunk);
            process(sd, Math.min(uploaded.length * chunkSize, total), total, new Date().getTime() - startTime);
            //
            /***
             * 创建文件上传参数
             **/
            const createUploadData2 = {
              nowSlice: chunkInfo.currentChunk + 1,
              totalSlice: chunkCount,
              sliceId: sliceId,
              fileSumMd5: fileMd5,
            };
            resolve(createUploadData2);
          })
          .catch(() => {
            reject();
            uploadChunkError && uploadChunkError();
          });
      });
    }).then((uploadData) => {
      success(uploadData, file.name);
      //   console.log("finish", res);
    });
  };

  /***
   * 创建文件上传参数
   **/
  const createUploadData = (chunkInfo: IChunkInfo2) => {
    const fetchForm: FormData = new FormData();
    const nowSlice = chunkInfo.currentChunk;
    fetchForm.append("nowSlice", String(nowSlice));
    fetchForm.append("totalSlice", String(chunkCount));
    fetchForm.append("sliceId", sliceId);
    const chunkfile = new File([chunkInfo.chunk], file.name + "." + nowSlice);
    fetchForm.append("file", chunkfile); // fetchForm.append('file', chunkInfo.chunk)
    fetchForm.append("fileSumMd5", fileMd5);

    return fetchForm;
  };

  readFileMd5(); // 开始执行代码
};
