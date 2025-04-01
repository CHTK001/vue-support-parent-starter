package com.chua.starter.video.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chua.starter.video.entity.VideoMark;
import com.chua.starter.video.mapper.VideoMarkMapper;
import com.chua.starter.video.service.VideoMarkService;
@Service
public class VideoMarkServiceImpl extends ServiceImpl<VideoMarkMapper, VideoMark> implements VideoMarkService{

}
