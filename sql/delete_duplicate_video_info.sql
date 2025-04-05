-- 删除video_info表中video_title、video_director和video_type完全相同的重复数据
-- 保留每组重复数据中的一条记录，删除其余重复记录

-- 方法一：使用ROW_NUMBER()窗口函数（适用于MySQL 8.0+、PostgreSQL、SQL Server等）
DELETE FROM video_info
WHERE video_id IN (
    SELECT video_id
    FROM (
        SELECT 
            video_id,
            ROW_NUMBER() OVER(PARTITION BY video_title, video_director, video_type ORDER BY video_id) AS row_num
        FROM video_info
    ) AS temp
    WHERE row_num > 1
);

-- 方法二：使用自连接（适用于所有SQL数据库）
/*
DELETE FROM video_info
WHERE video_id IN (
    SELECT v1.video_id
    FROM video_info v1
    JOIN video_info v2 ON 
        v1.video_title = v2.video_title AND
        v1.video_director = v2.video_director AND
        v1.video_type = v2.video_type AND
        v1.video_id > v2.video_id
);
*/

-- 方法三：使用子查询（适用于MySQL等）
/*
DELETE v1 FROM video_info v1
JOIN (
    SELECT MIN(video_id) AS min_id, video_title, video_director, video_type
    FROM video_info
    GROUP BY video_title, video_director, video_type
    HAVING COUNT(*) > 1
) v2 ON 
    v1.video_title = v2.video_title AND
    v1.video_director = v2.video_director AND
    v1.video_type = v2.video_type AND
    v1.video_id > v2.min_id;
*/

-- 注意：执行删除操作前，建议先进行备份或测试
-- 可以先使用SELECT查询来验证将要删除的记录
/*
SELECT v1.*
FROM video_info v1
JOIN (
    SELECT video_title, video_director, video_type
    FROM video_info
    GROUP BY video_title, video_director, video_type
    HAVING COUNT(*) > 1
) v2 ON 
    v1.video_title = v2.video_title AND
    v1.video_director = v2.video_director AND
    v1.video_type = v2.video_type
ORDER BY v1.video_title, v1.video_director, v1.video_type, v1.video_id;
*/