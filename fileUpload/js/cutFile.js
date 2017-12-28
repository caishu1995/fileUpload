///切分文件（切割大小2M）
///fileObj：文件对象
///返回   ：文件信息。
    ///返回[i].id  :文件序号
    ///返回[i].file:本块内容
function cutFileContent(fileobj) {
    var cutSize = 2 * 1024 * 1024;

    var name = fileobj.name;
    var fileSize = fileobj.size;
    var fileArr = [];  //拆分后的内容，{name: aa.part1,file: ...}

    //切分整大小的内容
    var count = fileSize / cutSize | 0;
    for (var i = 0; i < count; i++) {
        fileArr.push({
            id: i,
            file: fileobj.slice(cutSize * i, cutSize * (i + 1)),
            size: cutSize,
            fileName: fileobj.name
        })
    }
    //切分最后一块的内容
    fileArr.push({
        id: count,
        file: fileobj.slice(cutSize * count, fileSize),
        size: fileSize - cutSize * count,
        fileName: fileobj.name
    })

    return fileArr;
}