package com.aipixelstudio.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/** Queries used exclusively by the administration dashboard. */
@Mapper
public interface AdminMapper {
    @Select("SELECT COUNT(*) FROM upload_file WHERE create_time >= CURDATE()")
    long countTodayUpload();

    @Select("SELECT COUNT(*) FROM generation_log WHERE create_time >= CURDATE()")
    long countTodayGenerate();
}
