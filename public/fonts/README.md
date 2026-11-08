# Folio 内置字体

五款字体均以 SIL Open Font License 1.1 分发，可用于商业文章和设计；授权原文随各字体保留。字体文件来自官方仓库或官方发布包，未修改、未裁剪，也不会安装到操作系统。

| 字体 | 建议用途 | 来源 | 授权 |
| --- | --- | --- | --- |
| Noto 黑体 / Noto Sans SC | 正文、信息说明 | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/notosanssc) | [OFL](noto-sans-sc/OFL.txt) |
| Noto 宋体 / Noto Serif SC | 人文长文、书刊章题 | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/notoserifsc) | [OFL](noto-serif-sc/OFL.txt) |
| 霞鹜文楷 / LXGW WenKai | 故事、随笔 | [v1.530](https://github.com/lxgw/LxgwWenKai/releases/tag/v1.530) | [OFL](lxgw-wenkai/OFL.txt) |
| 得意黑 / Smiley Sans | 短标题、重点短句 | [v2.0.1](https://github.com/atelier-anchor/smiley-sans/releases/tag/v2.0.1) | [OFL](smiley-sans/OFL.txt) |
| 站酷小薇 / ZCOOL XiaoWei | 标题、题记 | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/zcoolxiaowei) | [OFL](zcool-xiaowei/OFL.txt) |

`sources.json` 记录下载地址、文件大小及 SHA-256。Google Fonts 的字体以该校验值标识所用版本；另两款固定在上述发布版本。

字体原文件共约 76 MB，浏览器仅在正文、局部文字或样张使用对应字体时加载，普通页面不预加载。`fonts.css` 使用 `font-display:swap`，载入期间先显示后备字体。得意黑和站酷小薇是展示字体，建议用在短标题；静态字体的加粗由浏览器合成。

可编辑文字模式只保留字体名称，不嵌入字体文件，微信端可能替换字形。公众号导出新增「全文逐段高清图」和「章题高清图」：把对应字形绘制为 3 倍 PNG，不再依赖读者安装字体。转图内容无法在微信中直接选字、编辑、调整阅读字号或点击原有链接；Folio 原稿保持可编辑。复制缺图时，可下载字体素材包并在公众号后台按编号补传 PNG，上传后字形随图片保留。不要将本目录字体文件作为单独商品出售；修改或再分发时须遵循各自授权的保留声明、保留名称等条款。
