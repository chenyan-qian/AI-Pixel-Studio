package com.aipixelstudio.mapper;

import com.aipixelstudio.entity.EmailCode;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface EmailCodeMapper extends BaseMapper<EmailCode> {
    @Update("UPDATE email_code SET used = 1 WHERE email = #{email} AND used = 0")
    int invalidateUnusedByEmail(@Param("email") String email);

    @Update("UPDATE email_code SET used = 1 WHERE id = #{id} AND used = 0")
    int consume(@Param("id") Long id);
}
