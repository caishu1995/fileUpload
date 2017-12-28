function FileUploadClass() {
    this.userSet_domId = "";              //对应的DOM结构中的id号
    this.userSet_cancelRequestUrl = "";   //取消时请求的地址
    this.userSet_sendRequestUrl = "";     //上传时请求的地址
    this.userSet_deleteRequestUrl = "";   //删除时请求的地址
    this.userSet_isAutoUpload = false;   //是否默认自动上传，true为自动上传
    this.userSet_extensionList = [];      //允许上传的扩展名列表
    this.userSet_typeList = [];           //允许上传的类型列表

    ///所有添加过的上传文件列表
    ///file     ：文件内容
    ///name     ：原文件名称(文件自带，只读)
    ///newName  ：可修改的文件名称
    ///state    :文件状态，0未上传；1上传成功；2上传失败；3已删除
    ///size     ：文件大小
    ///type     ：文件类型
    this.fileWaitUpLoadList = [];
    this.inPageListIndex = -1;                 //对应集合中的序号
    this.fileUploadClassVersion = "upload.0.1";//当前类的版本号

    this.allUploadCount = 0;     //总大小的个数
    this.hasSendUploadCount = 0; //已上传的个数
    this.loadingCount = 0;       //正在上传的个数
    this.hasErrorUploadCount = 0;//已错误的个数
    this.needUploadIdList = [];  //需要上传的文件id集合

    /*-- 对总页面的DOM结构的操作 --*/
    ///创建
    this.init = function() {
        //存储到页面的该类型的对象集合中，并获得并记录序号
        fileUploadObjList.push(this);
        this.inPageListIndex = fileUploadObjList.length - 1;

        //创建页面内容
        var parameter = {};
        parameter.inPageListIndex = this.inPageListIndex;
        parameter.isAutoUpload = this.userSet_isAutoUpload;
        document.getElementById(this.userSet_domId).innerHTML = getBaseHTML(parameter);// templateEngineer("fileUploadBaseTemplate", parameter);

        //如果是自动上传，则改变高度
        if(parameter.isAutoUpload){
            var fileShowDiv = document.getElementById(this.userSet_domId).getElementsByClassName("fileShowDiv")[0];
            fileShowDiv.style.height = "100%";
        }
    };

    ///获得页面的dom字符串
    ///obj：参数集合
    function getBaseHTML(obj) {
        var p = [];
        with(obj){
            p.push('<div class="fileUpload" data-objIndex="');
            p.push( obj.inPageListIndex );
            p.push('"><div class="fileShowDiv" ondragenter="this.classList.add(\'mouseEnter\');" ondragleave="dragLeave(this, event)" ondrop="this.classList.remove(\'mouseEnter\');"><div class="fileShowBig"><div class="fileShow addDiv"><div class="fileShowHead">选择上传文件</div><div class="fileShowBody">+</div><input type="file" onchange="getFileAndCreateDom(this, null)" ondrop="getFileAndCreateDom(this, event);" ondragover="event.preventDefault()"  multiple/></div></div></div>');
            if(!obj.isAutoUpload) {
                p.push('<div class="progressDiv"><div class="progressAll"><div class="progressSuccess"></div><div class="progressLoading"></div><div class="progressError"></div></div><button onclick="submitButtonOnClick(this)">提&nbsp;交</button></div>');
            }
            p.push('</div>');
        }
        return p.join('');
    }

    ///修改进度条的进度
    ///hasSendCount ：已经发送的总数
    ///loadingUploadCount:正在上传的数
    ///hasErrorCount：出错的总数
    ///allCount     ：总数
    ///progressBarDiv ：进度条的dom元素
    function changeProgressBarWidth(hasSendCount, loadingUploadCount, hasErrorCount, allCount, progressBarDiv) {
        var successPercent = 0;
        var loadingPercent = 0;
        var errorPercent = 0;

        //计算总上传比例
        if(allCount == 0) successPercent = 0;
        else successPercent = parseInt((hasSendCount * 100 * 100) / allCount) / 100;

        //计算正在上传的比例
        if(loadingUploadCount == 0) loadingPercent = 0;
        else if(hasSendCount + hasErrorCount == allCount) loadingPercent = 0;
        else loadingPercent = parseInt((loadingUploadCount * 100 * 100) / allCount) / 100;

        //计算上传错误比例
        if(hasSendCount == 0) errorPercent = 0;
        else errorPercent = parseInt((hasErrorCount * 100 * 100) / allCount) / 100;

        //改变宽度
        progressBarDiv.children[0].style.width = successPercent + '%';         //改总宽度
        progressBarDiv.children[0].innerText = hasSendCount + '/' + allCount;  //改文字
        progressBarDiv.children[1].style.width = loadingPercent + '%';         //改总宽度
        progressBarDiv.children[1].innerText = loadingUploadCount + '/' + allCount;  //改文字
        progressBarDiv.children[2].style.width = errorPercent + '%';         //改总宽度
        progressBarDiv.children[2].innerText = hasErrorCount + '/' + allCount;  //改文字
    }


    /*-- 对每个文件展示区的DOM结构的操作 --*/
    ///根据文件的状态，修改文件对应的class,以控制出现不同效果
    ///domObj：dom结构对象
    ///state ：修改值 0成功 1失败 2等待处理 3正在处理
    this.changeFileClass = function(domObj, state) {
        switch (state){
            case 0:
                domObj.children[0].className = "fileShow fileProgressBarOk";
                break;
            case 1:
                domObj.children[0].className = "fileShow fileProgressBarError";
                break;
            case 2:
                domObj.children[0].className = "fileShow fileProgressBarWait";
                break;
            case 3:
                domObj.children[0].className = "fileShow fileProgressBarUploading";
                break;
            default:
                break;
        }
    };

    ///交换两个dom节点的内容
    ///domId1:节点1
    ///domId2:节点2
    this.changeTwoFileDOM = function(domId1, domId2) {
        var domInnerHTML = document.getElementById(domId1).innerHTML;
        document.getElementById(domId1).innerHTML = document.getElementById(domId2).innerHTML;
        document.getElementById(domId2).innerHTML = domInnerHTML;
    };

    ///创建文件展示区域的模块内容
    ///fileObj：文件对象(参见 getShowInformationFromBaseList() 的返回值)
    ///返回   ：创建好的元素对象
    this.createFileShow = function(fileObj) {
        var fileBaseDiv = document.createElement("div");
        fileBaseDiv.id = this.userSet_domId + "_" + fileObj.id;
        fileBaseDiv.className = "fileShowBig";
        fileBaseDiv.innerHTML = getFileShow(fileObj);//templateEngineer("fileUploadBaseDivTemplate", fileObj)

        fileBaseDiv.draggable = true;
        fileBaseDiv.ondragstart = function(ev) { ev.dataTransfer.setData("Text", fileBaseDiv.id); };
        fileBaseDiv.ondragover = function(ev) { ev.preventDefault(); };
        fileBaseDiv.ondrop =  function(ev) { oneFileDivOnDropFunction(this, ev); };

        return fileBaseDiv;
    };

    ///获得单个展示区的dom字符串
    ///obj：参数集合
    function getFileShow(obj) {
        var p = [];
        with(obj){
            p.push('<div class="fileShow fileProgressBarWait" ><input type="text" class="fileShowHead" value="');
            p.push( obj.allName );
            p.push('" title="');
            p.push( obj.allName );
            p.push('" onblur="changeNameOnChangeFunction(this)" ondblclick="renameOnDblClick(this)" readonly/><div class="fileShowBody"><img src="Style/img/');
            p.push( obj.suffix );
            p.push('_128.png" /></div><div class="fileShowProgressBar"><div class="fileShowProgressBarContent"></div></div><div class="fileShowFoot"><label class="fileShowFootText">');
            p.push( obj.fileSize );
            p.push('</label><div class="cancelButton" onclick="cancelButtonOnClick(this)"><img src="./Style/img/delete_16.png" title="取消"/></div><div class="resentButton" onclick="resentButtonOnClick(this)"><img src="./Style/img/refresh_16.png" title="重新上传"/></div><div class="deleteButton" onclick="deleteButtonOnClick(this)"><img src="./Style/img/delete_16.png" title="删除"/></div></div></div>');
        }
        return p.join('');
    }

    ///根据后缀名修改图片区域的内容
    ///thisEle：当前元素
    ///fileObj: 文件的信息
    function setImgSrcBySuffix(thisEle, fileObj) {
        ///如果是图片，则展示图片内容
        var imgList= ["jpg", "png", "jpeg", "bmp", "gif", "svg", "tiff"];
        for(var i = 0; i < imgList.length; i++){
            if(fileObj.suffix === imgList[i]){
                if (window.FileReader) {
                    var reader = new FileReader();
                    reader.readAsDataURL(fileObj.file);
                    //监听文件读取结束后事件
                    reader.onloadend = function (e) {
                        thisEle.children[0].children[1].children[0].src = e.target.result;
                    };
                }
            }
        }
    }


    /*--  对文件信息集合(fileWaitUpLoadList)的操作  --*/
    ///添加操作
    ///fileObj：需存储的对象
    ///返回   ：对象存储的序号
    this.addBaseListOperation = function(fileObj) {
        fileObj.file = fileObj.slice(0, fileObj.size);  //增加文件内容
        fileObj.state = 0;                              //增加文件状态
        fileObj.newName = fileObj.name;                 //增加可修改的名称
        this.fileWaitUpLoadList.push(fileObj);         //将对象存储，以便上传文件
        return this.fileWaitUpLoadList.length - 1;    //返回添加的位置
    };

    ///交换两个内容的操作
    ///listIndex1 :第一个内容在序号中的位置
    ///listIndex2 :第二个内容在序号中的位置
    this.changeTwoBaseListOperation = function(listIndex1, listIndex2) {
        var listContent = this.fileWaitUpLoadList[listIndex1];
        this.fileWaitUpLoadList[listIndex1] = this.fileWaitUpLoadList[listIndex2];
        this.fileWaitUpLoadList[listIndex2] = listContent;
    };

    ///获得id的form结构
    ///id: id号
    ///返回：该id上传时用的form结构
    this.getFormFromBaseListOperation = function(id) {
        this.changeFileClass(document.getElementById(this.userSet_domId + "_" + id), 3); //修改内容

        //追加form，等待上传
        var fileNeedUpLoadList = new FormData();//需要上传的form内容
        fileNeedUpLoadList.append("file", this.fileWaitUpLoadList[id].file);
        fileNeedUpLoadList.append("fileName", this.fileWaitUpLoadList[id].newName);
        fileNeedUpLoadList.append("id", id);
        fileNeedUpLoadList.append("size", this.fileWaitUpLoadList[id].size);
        //文件哈希
        //当前用户名
        fileNeedUpLoadList.append("version", this.fileUploadClassVersion);//上传方式 upload.0.1(组件名称)
        fileNeedUpLoadList.append("date", Date.now());                    //前台传输时间

        return fileNeedUpLoadList;//返回值
    };

    ///获得展示时需要的数据内容
    ///index  : 文件元素在列表中的序号
    ///返回   ：文件信息。
    ///     返回.allName ：文件全名
    ///     返回.file    ：文件内容
    ///     返回.fileSize：文件大小
    ///     返回.id      ：文件对应集合中的序号
    ///     返回.isAutoUpload：文件是否自动上传
    ///     返回.suffix  ：文件后缀名
    ///     返回.type    ：文件类型
    this.getShowInformationFromBaseList = function(index) {
        ///获得可展示的信息
        var fileInformation = {};
        //计算文件大小
        if (this.fileWaitUpLoadList[index].size > (1024 * 1024)) fileInformation.fileSize = changeShowSizeToMB(this.fileWaitUpLoadList[index].size);
        else if (this.fileWaitUpLoadList[index].size > 1024)    fileInformation.fileSize = changeShowSizeToKB(this.fileWaitUpLoadList[index].size);
        else  fileInformation.fileSize = changeShowSizeToB(this.fileWaitUpLoadList[index].size);
        //获得其他内容
        fileInformation.allName = this.fileWaitUpLoadList[index].newName;
        fileInformation.file = this.fileWaitUpLoadList[index].file;
        fileInformation.id = index;
        fileInformation.isAutoUpload = this.userSet_isAutoUpload;
        fileInformation.suffix = this.fileWaitUpLoadList[index].newName.substring(this.fileWaitUpLoadList[index].newName.lastIndexOf(".") + 1, this.fileWaitUpLoadList[index].length);
        fileInformation.type = this.fileWaitUpLoadList[index].type;

        return fileInformation;
    };

    ///替换操作
    ///fileObj：需存储的对象
    ///index  ：需替换的位置
    this.replaceBaseListOperation = function(fileObj, index) {
        fileObj.file = fileObj.slice(0, fileObj.size);  //增加文件内容
        fileObj.state = 0;                              //增加文件状态
        fileObj.newName = fileObj.name;                 //增加可修改的名称
        this.fileWaitUpLoadList[index] = fileObj;      //替换原对象
    };


    /*--  页面操作对应的函数  --*/
    ///取消
    ///thisEle:当前元素
    this.cancelFileUpload = function(thisEle) {
        var thisFileEle = thisEle.parentNode.parentNode.parentNode;
        var id = thisFileEle.id.split('_')[1];

        var fd = this.getFormFromBaseListOperation(id);//准备上传文件

        //事件集合
        var functionList = {};
        var fileObj = this;
        functionList.loadFunction = function(e) {
            if((e.currentTarget.status == 200) && (e.currentTarget.readyState == 4)){
                var obj = JSON.parse(e.currentTarget.responseText);
                if(obj.state == "ok"){
                    //改变状态为失败
                    fileObj.fileWaitUpLoadList[id].state = 2;
                    fileObj.changeFileClass(thisEle.parentNode.parentNode.parentNode, 1);
                }
            }
        };

        progressListen(this.userSet_cancelRequestUrl, fd, false, functionList);
    };

    ///改变名称
    ///thisEle:当前元素
    this.changeName = function(thisEle){
        var domObj = thisEle.parentNode.parentNode;
        var listIndex = domObj.id.split("_")[1];

        this.fileWaitUpLoadList[listIndex].newName = thisEle.value; //改变数据中名称
        thisEle.defaultValue = thisEle.value;                       //改变默认内容
        thisEle.title = thisEle.value;                              //改变标题

        thisEle.classList.remove("canRename");   //输入区域改变样式
        this.readOnly = true;                   //禁止更改
        this.draggable = true;                  //允许移动
    };

    ///交换两个dom节点的数据和结构
    ///domId1:节点1
    ///domId2:节点2
    this.changeTwoDOMData = function(domId1, domId2) {
        var listIndex1 = domId1.split("_")[1];
        var listIndex2 = domId2.split("_")[1];

        ///不属于同一区域、自动上传模式、存在已上传的文件  禁止替换操作
        if(domId1 == domId2) return;                                                              //如果是同一元素，禁止操作
        if(this.userSet_isAutoUpload) { alert("自动上传模式不支持交换"); return; }               //自动上传模式，禁止操作
        if(domId1.split("_")[0] != domId2.split("_")[0]) { alert("不同区域不支持交换"); return; } //两个移动的不属于一个区域，禁止操作
        if((this.fileWaitUpLoadList[listIndex1].state == 1) || (this.fileWaitUpLoadList[listIndex2].state == 1)) { alert("已上传成功的文件不支持交换"); return; } //已经上传成功，禁止操作

        this.changeTwoBaseListOperation(listIndex1, listIndex2); //交换文件信息集合的内容
        this.changeTwoFileDOM(domId1, domId2);                   //交换dom内容
    };

    ///手动上传模式中的文件替换操作
    ///鼠标移动文件到文件DOM上进行的操作。目的是替换文件存储内容和更换DOM展示内容
    ///fileObj：文件元素对象
    ///thisELe：需被覆盖的DOM节点
    this.replaceOneFile = function(fileObj, thisELe) {
        if(!checkCanUpload(this.userSet_extensionList, this.userSet_typeList, fileObj[0])) return;         //检查类型，如果类型错误，则不处理
        if(this.userSet_isAutoUpload) { alert("自动上传模式不支持替换"); return; }                         //如果是自动上传模式，则禁止替换操作

        var index = thisELe.id.split("_")[1];                                                           //获得该文件在数组中的编号
        if(this.fileWaitUpLoadList[index].state == 1) { alert("已上传成功的文件不支持替换"); return; } //如果已经上传成功，则禁止替换操作

        this.replaceBaseListOperation(fileObj[0], index);                  //替换列表中内容

        var fileInformation = this.getShowInformationFromBaseList(index); //获得创建dom结构用文件信息
        var contentShowObj = this.createFileShow(fileInformation);        //获得用于展示的dom结构
        thisELe.parentNode.insertBefore(contentShowObj, thisELe);          //插入新创建的元素
        setImgSrcBySuffix(contentShowObj, fileInformation);                //根据后缀名修改图片的展示内容
        thisELe.parentNode.removeChild(thisELe);                           //删除当前节点
    };

    ///删除文件内容
    ///thisEle:当前元素
    this.deleteFileInformation = function(thisEle) {
        var thisFileEle = thisEle.parentNode.parentNode.parentNode;
        var id = thisFileEle.id.split('_')[1];
        var canDelete = false;

        if (this.fileWaitUpLoadList[id].state == 1) {
            //如果已经上传完成，则通知后台，删除文件
            var fd = this.getFormFromBaseListOperation(id);//准备上传文件

            //事件集合
            var functionList = {};
            functionList.loadFunction = function(e) {
                if((e.currentTarget.status == 200) && (e.currentTarget.readyState == 4)) {
                    var obj = JSON.parse(e.currentTarget.responseText);

                    if(obj.state == "ok") canDelete = true;
                    else canDelete = false;
                }
            };
            functionList.errorFunction = function (e) {
                canDelete = false;
            }

            progressListen(this.userSet_deleteRequestUrl, fd, false, functionList);
        } else { canDelete = true; }//如果不需删除后端数据，则直接允许删除节点数据

        if(canDelete){
            this.fileWaitUpLoadList[id].state = 3;
            thisFileEle.parentNode.removeChild(thisFileEle);
        } else { alert("删除失败"); }
    };

    ///通过选择区域内容、或拖动的文件内容，获得并存储文件信息，创建并显示的dom结构，如果要求自动上传，则直接上传
    ///thisELe     ：当前元素
    ///e           ：如果是change事件,则为null,如果是拖动事件，则为event
    this.recordAndCreateDOM = function(thisEle, e) {
        var fileList = [];//选中的文件集合
        var parentNode = thisEle.parentNode.parentNode.parentNode;   //parent节点

        //获得文件集合
        if(e === null){
            fileList = thisEle.files;
        } else{
            e.preventDefault();
            fileList = e.dataTransfer.files;
        }

        //记录文件内容，并创建元素
        for (var i = 0; i < fileList.length; i++) {
            if(!checkCanUpload(this.userSet_extensionList, this.userSet_typeList, fileList[i])) continue;  //检查类型，如果类型错误，则跳过此文件

            var index = this.addBaseListOperation(fileList[i]);             //添加到文件列表，并获得文件存储的序号

            var fileInformation = this.getShowInformationFromBaseList(index);//获得创建dom结构用文件信息
            var contentShowObj = this.createFileShow(fileInformation);       //获得展示的dom结构
            parentNode.insertBefore(contentShowObj, parentNode.children[parentNode.children.length - 1]);  //插入元素
            setImgSrcBySuffix(contentShowObj, fileInformation);               //根据后缀名修改图片的展示内容

            ///如果自动上传
            if(this.userSet_isAutoUpload){
                this.needUploadIdList.push(index);                          //往需上传的队列中添加该需上传的id
                this.allUploadCount++;
            }
        }

        if(this.userSet_isAutoUpload) this.uploadFileAuto();   //如果用户设置是自动上传，则运行自动上传函数
    };

    ///重新上传
    ///id:当前元素在数组中的序号
    this.resendFile = function (id) {
        this.changeFileClass(document.getElementById(id), 2);//修改展示的状态为等待上传

        this.needUploadIdList.push(id.split('_')[1]);        //往需上传的队列中添加该需上传的id
        this.allUploadCount++;                               //总数自增

        this.uploadFileAuto();                              //自动上传
    };

    ///统一提交
    ///thisELe     ：当前元素
    this.unifiedSubmission = function(thisEle) {
        thisEle.disabled = true;//禁止多次提交

        changeProgressBarWidth(0, 0, 0, 0, thisEle.parentNode.children[0]);//显示总进度条

        //统计所有没上传的文件
        for(var i = 0; i < this.fileWaitUpLoadList.length; i++){
            if((this.fileWaitUpLoadList[i].state === 0) || (this.fileWaitUpLoadList[i].state === 2)){
                this.needUploadIdList.push(i);   //往需上传的队列中添加该需上传的id
                this.changeFileClass(document.getElementById(this.userSet_domId + "_" + i), 2); //修改展示的状态为等待上传
                this.allUploadCount++;
            }
        }

        this.uploadFileAuto();//提交全部

        thisEle.disabled = false;//允许再次提交
    };


    /*--  上传  --*/
    ///对过程进行监听
    ///url          :传输url
    ///sendData     :发送的数据
    ///isAsync      :是否为异步访问
    ///functionList :过程中监听的事件集(对象)
    ///functionList.abortFunction：           终止时触发的事件，function(){}
    ///functionList.errorFunction：           出错时触发的事件，function(){}
    ///functionList.loadFunction：            服务器返回响应时触发的事件，function(){}    if((e.target.readyState == 4) && (e.target.status == 200))  var aa = e.target.responseText;
    ///functionList.loadStartFunction：       加载开始时触发的事件，function(){}
    ///functionList.loadEndFunction：         加载终止时触发的事件，function(){}
    ///functionList.timeOutFunction：         超时时触发的事件，function(){}
    ///functionList.upload.progressFunction： 过程中时触发的事件，function(){}
    ///functionList.readyStateChangeFunction：readyState改变时触发的事件，function(){}
    ///index        :存储时用的序号
    function progressListen(url, sendData, isAsync, functionList) {
        var xhr;
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            xhr = new ActiveXObject('Microsoft.XMLHTTP');
        }

        xhr.open("POST", url, isAsync);

        //添加监听事件
        if (functionList != null) {
            xhr.onabort = functionList.abortFunction;
            xhr.onerror = functionList.errorFunction;
            xhr.onload = functionList.loadFunction;
            xhr.onloadstart = functionList.loadStartFunction;
            xhr.onloadend = functionList.loadEndFunction;
            xhr.ontimeout = functionList.timeOutFunction;
            xhr.upload.onprogress = functionList.progressFunction;

            xhr.addEventListener('readystatechange', functionList.readyStateChangeFunction, false);
        }

        xhr.send(sendData);
    }

    ///上传文件
    ///如果存在文件需要上传，则先上传，然后其中设置了一个3S的延迟，确保一个文件上传完再上传其他文件
    ///如果无文件需要上传，则清空数据
    this.uploadFileAuto = function() {
        //如果有需要上传的，就上传
        if(this.needUploadIdList.length){
            var fileUploadForm = this.getFormFromBaseListOperation(this.needUploadIdList[0]);//准备上传，获得上传的文件内容
            this.loadingCount++;

            ///添加监听
            var functionList = {};
            var fileObj = this;
            functionList.progressFunction = function(e) { progressFunction(e, fileObj); };
            functionList.loadFunction = function(e) { uploadSuccessFunction(e, fileObj); };

            progressListen(this.userSet_sendRequestUrl, fileUploadForm, true, functionList);    //上传
        } else{
            //如果所有内容都传输完毕，则清空
            this.hasSendUploadCount = 0;
            this.allUploadCount = 0;
            this.loadingCount = 0;
            this.hasErrorUploadCount = 0;
        }
    };

    ///上传成功的函数
    ///result：结果集字符串
    function uploadSuccessFunction(e, fileObj) {
        if((e.currentTarget.status == 200) && (e.currentTarget.readyState == 4)) {
            var obj = JSON.parse(e.currentTarget.responseText);
            var index = fileObj.needUploadIdList[0];    //对应的数组编号
            document.getElementById(fileObj.userSet_domId + "_" + index).children[0].children[2].children[0].style.width = "";//如果progress执行过会对元素产生width，这样可以去除设置的width

            ///判断状态是否为正常
            if(obj.state == "error") { //如果出错
                fileObj.fileWaitUpLoadList[index].state = 2;//改变数据的状态
                fileObj.hasErrorUploadCount++;
                fileObj.changeFileClass(document.getElementById(fileObj.userSet_domId + "_" + index), 1);
            } else if(obj.state == "ok") {
                fileObj.fileWaitUpLoadList[index].newName = obj.fileNewName;  //改变数据中名称
                var input = document.getElementById(fileObj.userSet_domId + "_" + index).children[0].children[0];
                input.defaultValue = obj.fileNewName;                        //改变默认内容
                input.title = obj.fileNewName;                               //改变标题
                input.ondblclick = "";

                fileObj.fileWaitUpLoadList[index].state = 1;//改变数据的状态
                fileObj.hasSendUploadCount++;               //增加成功的个数
                fileObj.changeFileClass(document.getElementById(fileObj.userSet_domId + "_" + index), 0);
            }

            if(!fileObj.userSet_isAutoUpload) {
                changeProgressBarWidth(fileObj.hasSendUploadCount, fileObj.loadingCount, fileObj.hasErrorUploadCount, fileObj.allUploadCount, document.getElementById(fileObj.userSet_domId).children[0].children[1].children[0]);//进度条前进
            }

            fileObj.loadingCount--;                   //正在上传的文件个数减一
            fileObj.endSentFunction();                //直接执行函数
        }
    }

    ///progress函数
    ///e      :事件
    function progressFunction (e, fileObj){
        if (e.lengthComputable) {
            if(e.loaded == e.total){ return; } //如果已经传完直接进入load即可

            document.getElementById(fileObj.userSet_domId + "_" + fileObj.needUploadIdList[0]).children[0].children[2].children[0].style.width = (e.loaded * 100 / e.total) + "%"; //改变宽度为比例
        }
    }

    ///文件传输结束后的操作
    this.endSentFunction = function(){
        this.needUploadIdList.splice(0, 1); //从等待上传的列表中删除当前节点
        this.uploadFileAuto();              //继续执行操作
    };


    /*--  转换单位  --*/
    ///B转换成B,判断是否为空 0
    ///byteCount: 以B为单位的数
    ///返回     ：返回转换后的字符串
    function changeShowSizeToB(byteCount) {
        if((byteCount <= 0) || (byteCount == null) || (byteCount == "")) return "";

        var str = byteCount.toString() + "B";
        return str;
    }

    ///B转换成KB,判断是否为空 0
    ///byteCount: 以B为单位的数
    ///返回     ：返回转换后的字符串
    function changeShowSizeToKB(byteCount) {
        if((byteCount <= 0) || (byteCount == null) || (byteCount == "")) return "";

        var str = (Math.round(byteCount / 1024 * 100) / 100).toString() + "KB";
        return str;
    }

    ///B转换成MB,判断是否为空 0
    ///byteCount: 以B为单位的数
    ///返回     ：返回转换后的字符串
    function changeShowSizeToMB(byteCount) {
        if((byteCount <= 0) || (byteCount == null) || (byteCount == "")) return "";

        var str = (Math.round(byteCount / 1024 / 1024 * 100) / 100).toString() + "MB";
        return str;
    }


    /*-- 其他操作  --*/
    ///检查文件是否允许上传
    ///大小是否超过、类型扩展名是否符合类型
    ///extensionList：允许上传的扩展名
    ///typeList     ：允许上传的类型
    ///fileObj      ：需要检查的对象，检查name扩展名、type文件类型
    ///返回         ：是否符合类型，true 符合
    function checkCanUpload(extensionList, typeList, fileObj) {
        //检查大小
        if(fileObj.size > (1024 * 1024 * 2)) return false;//如果超大则返回false

        ///检查类型和扩展名
        if((!typeList.length) && (!extensionList.length)) return true; //如果类型和扩展名定义均为空，则表示允许任何文件上传，则返回true
        //检查类型
        if(typeList.length) {
            var j = 0;
            for( ; j < typeList.length; j++) {
                if(fileObj.type == typeList[j]) return true; //如果允许上传，则返回true
            }
        }
        //检查扩展名
        var extension = fileObj.name.substring(fileObj.name.lastIndexOf(".") + 1, fileObj.length); //获得文件扩展名
        if(extensionList.length){
            var i = 0;
            for( ; i < extensionList.length; i++){
                if(extension == extensionList[i])  return true; //如果允许上传，则返回true
            }
        }

        return false;
    }

    ///获得模板的字符串
    ///id   模板的id号
    ///data  数据源
    ///返回 模板的字符串
    function templateEngineer(id, data){
        var html = document.getElementById(id).innerHTML;//获得模板的html代码

        var result = " var p = [];with(obj){ p.push(' "
            + html.replace(/[\r\n\t]/g, " ")  //将换行符替换成空格，避免形成的函数报错
                .replace(/<%=(.*?)%>/g, "');p.push($1);p.push('")//替换<%= %>
                .replace(/<%/g, " '); ")          //替换<%
                .replace(/%>/g, " p.push(' ")     //替换%>
            + " ');}return p.join(''); ";      //加结尾

        var fn = new Function("obj",result); //创建函数，参数为obj，内容为result
        return fn(data);                   //返回函数的值
    }
}


///存储本界面上所有类的对象
var fileUploadObjList = [];

//在页面载入时防止默认事件发生
document.ondragover = function(e){ e.preventDefault(); };
document.ondrop = function(e){ e.preventDefault(); };

///鼠标拖动文件离开区域事件
///判断到达的位置的祖先节点和当前节点的祖先节点是否一致，如果不一致，表示离开区域，则移除class
///thisEle:当前节点
///e      :事件
function dragLeave(thisEle, e){
    var toBaseDiv = e.relatedTarget;

    var i = 20;//为避免死循环，设置最大查找层数为20
    while((toBaseDiv.tagName != null) && (toBaseDiv.className != "fileShowDiv mouseEnter") && (toBaseDiv.tagName.toLocaleLowerCase() != "body") && (i > 0)){
        toBaseDiv = toBaseDiv.parentNode;
        i--;
    }

    //如果在块内移动，不删除class
    if(toBaseDiv != thisEle)
        thisEle.classList.remove('mouseEnter');
}

///选择文件的change事件、拖动的事件
///获得文件，获得并存储文件信息，创建并显示的dom结构
///thisELe     ：当前元素
///e           ：如果是change事件,则为null,如果是拖动事件，则为event
function getFileAndCreateDom(thisEle, e) {
    var baseDiv = thisEle.parentNode.parentNode.parentNode.parentNode;//找到基础元素
    fileUploadObjList[baseDiv.dataset.objindex].recordAndCreateDOM(thisEle, e);
}

///修改名称的change事件
///thisELe:当前元素
function changeNameOnChangeFunction(thisEle) {
    var baseDiv = thisEle.parentNode.parentNode.parentNode.parentNode;//找到基础元素
    fileUploadObjList[baseDiv.dataset.objindex].changeName(thisEle); //改变元素的名称
}

///取消按钮点击事件
///thisELe:当前元素
function cancelButtonOnClick(thisEle) {
    var baseDiv = thisEle.parentNode.parentNode.parentNode.parentNode.parentNode;//找到基础元素
    fileUploadObjList[baseDiv.dataset.objindex].cancelFileUpload(thisEle);
}

///重命名按钮的点击事件
///thisELe:当前元素
function renameOnDblClick(thisEle){
    var inputDiv = thisEle;//找到基础元素
    inputDiv.readOnly = false;           //允许修改
    inputDiv.classList.add("canRename");  //输入区域改变样式
    inputDiv.focus();                     //获得焦点
    thisEle.parentNode.parentNode.parentNode.draggable = false;//禁止移动
}

///删除按钮的点击事件
///thisELe:当前元素
function deleteButtonOnClick(thisEle) {
    var baseDiv = thisEle.parentNode.parentNode.parentNode.parentNode.parentNode;//找到基础元素
    fileUploadObjList[baseDiv.dataset.objindex].deleteFileInformation(thisEle);
}

///每个上传文件的div的drop函数
///thisELe:当前元素
///e      :事件
function oneFileDivOnDropFunction(thisEle, e) {
    e.preventDefault();

    var baseDiv = thisEle.parentNode.parentNode;//找到基础元素

    if(e.dataTransfer.files.length != 0){
        fileUploadObjList[baseDiv.dataset.objindex].replaceOneFile(e.dataTransfer.files, thisEle);                 //执行替换操作
    } else if(e.dataTransfer.getData("Text") != undefined) {
        fileUploadObjList[baseDiv.dataset.objindex].changeTwoDOMData(e.dataTransfer.getData("Text"), thisEle.id);  //执行交换操作
    }
}

///重新上传的点击事件
///thisELe:当前元素
function resentButtonOnClick(thisEle) {
    var baseDiv = thisEle.parentNode.parentNode.parentNode.parentNode.parentNode;//找到基础元素
    fileUploadObjList[baseDiv.dataset.objindex].resendFile(thisEle.parentNode.parentNode.parentNode.id);
}

///提交的点击事件
///thisELe:当前元素
function submitButtonOnClick(thisEle) {
    var baseDiv = thisEle.parentNode.parentNode;//找到基础元素
    fileUploadObjList[baseDiv.dataset.objindex].unifiedSubmission(thisEle);
}
