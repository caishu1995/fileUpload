using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;

namespace fileUploadNew
{
    /// <summary>
    /// DeleteData 的摘要说明
    /// </summary>
    public class DeleteData : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            string name = context.Request.Form["fileName"];

            if ( name == "desk1.jpg" )
            {
                context.Response.ContentType = "text/plain";
                context.Response.Write("{\"state\":\"error\"}");
                return;
            }
            else
            {
                if ( File.Exists(context.Server.MapPath("~/FileUploadDictionary/" + name)) )
                {
                    File.Delete(context.Server.MapPath("~/FileUploadDictionary/" + name));
                }

                context.Response.ContentType = "text/plain";
                context.Response.Write("{\"state\":\"ok\", \"name\": \"" + name + "\"}");
            }
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}