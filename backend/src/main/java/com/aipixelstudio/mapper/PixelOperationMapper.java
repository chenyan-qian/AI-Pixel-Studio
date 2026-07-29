package com.aipixelstudio.mapper;

import com.aipixelstudio.entity.PixelOperation;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PixelOperationMapper extends BaseMapper<PixelOperation> {
    @Insert("""
            <script>
            INSERT INTO pixel_operation (artwork_id, user_id, x, y, old_color, new_color, create_time) VALUES
            <foreach collection="operations" item="operation" separator=",">
              (#{operation.artworkId}, #{operation.userId}, #{operation.x}, #{operation.y}, #{operation.oldColor}, #{operation.newColor}, #{operation.createTime})
            </foreach>
            </script>
            """)
    int insertBatch(@Param("operations") List<PixelOperation> operations);
}
