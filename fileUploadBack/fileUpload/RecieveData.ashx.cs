using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;
using Newtonsoft.Json;

namespace fileUploadNew
{
    /// <summary>
    /// 接收数据，并保存
    /// </summary>
    public class RecieveData : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            fileReturnClass fileResultObj = new fileReturnClass();

            if ( context.Request.Form["fileName"] == "desk1.jpg" ) fileResultObj.state = "error";
            else
            {
                fileResultObj.fileName = context.Request.Form["fileName"];
                fileResultObj.fileNewName = DateTime.Now.ToString("yyyy-MMdd-HHmm-") + fileResultObj.fileName;
                fileResultObj.fileUrl = context.Server.MapPath("~/FileUploadDictionary/" + fileResultObj.fileNewName);
                string aa = context.Request.Form["size"];
                fileResultObj.fileSize = Int32.Parse(context.Request.Form["size"]);
                fileResultObj.uploadDate = DateTime.Now;

                try
                {
                    //创建新名称，保存文件
                    HttpPostedFile fileToUpload = context.Request.Files[0]; //获得文件
                    fileToUpload.SaveAs(fileResultObj.fileUrl);             //保存文件
                    fileResultObj.state = "ok";
                }
                catch ( Exception ee ) { fileResultObj.state = "error"; }
            }

            context.Response.ContentType = "text/plain";
            context.Response.Write(JsonConvert.SerializeObject(fileResultObj));
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }

    public class fileReturnClass {
        public string fileName;      //文件名
        public string fileNewName;   //文件新文件名
        public string fileUrl;       //文件存储的路径
        public int fileSize;         //文件大小
        public DateTime uploadDate;  //当前时间
        public string state;         //状态 "error" "ok"
    }
}