# format 用法详解

## 1.正则表达式
- `%(-)?(0?[0-9]+)?([.][0-9]+)?([#][0-9]+)?([scfpxodit%])`
- p0 前后补齐（默认向前补齐，-向后补齐）
- p1 补齐字符+补齐位数（补齐字符不设置按空格补齐，还支持`0`补齐）
- p2 小数补齐位数(.2补齐两位小数，.3补齐三位小数)
- p3 指定当前数字进制 (默认10进制，可选#2、#8、#16)
- p4 转换格式 (`%`、`s`、`c`、`f`、`p`、`x`、`o`、`d`、`i`、`t`)

## 2.常用格式化字符串
- `%%`          - %
- `%s`          - 字符串
- `%c`          - 单字符
- `%f`          - 浮点数
- `%p`          - 百分数
- `%x`          - 十六进制
- `%o`          - 八进制
- `%d`,`%i`     - 十进制

## 3.前后补齐
- `%5s`         - format("%5s","abc")       - result: "  abc"
- `%-5s`        - format("%-5s","abc")      - result: "abc  "
- `%5c`         - format("%5c","abc")       - result: "    a"
- `%-5c`        - format("%-5c","abc")      - result: "a    "
- `%05d`        - format("%05d","123")      - result: "00123"

## 4.小数补齐(四舍五入)
- `%.2f`        - format("%.2f",123.456)    - result: "123.46"

## 5.百分数
- `%p`          - format("%p",0.1234)       - result: "12%"
- `%.1p`        - format("%.1p",0.1234)     - result: "12.3%"
- `%.2p`        - format("%.2p",0.1234)     - result: "12.34%"

## 6.十进制转换
- `%x`          - format("%x",123)          - result: "7b"
- `%o`          - format("%o",123)          - result: "173"
- `%d`          - format("%d",123)          - result: "123"

## 7.指定进制转换
- `#2d`         - format("%#2d",11)         - result: "3"
- `#8d`         - format("%#8d",11)         - result: "9"
- `#16d`        - format("%#16d",11)        - result: "17"

## 8.时间格式化
- `%t`          - format("%t",now)          - result: "2020-01-01 01:01:01"
- `%1t`         - format("%1t",now)         - result: "2020-01-01"
- `%2t`         - format("%2t",now)         - result: "01:01:01"
- `%3t`         - format("%3t",now)         - result: "01:01:01.123"

## 9.单位转换
- `%k`          - format("%k",1234.56)      - result: "1K"
- `%.2k`        - format("%.2k",1234.56)    - result: "1.23k"