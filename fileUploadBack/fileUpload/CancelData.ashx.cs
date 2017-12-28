using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace fileUpload
{
    /// <summary>
    /// CancelData 的摘要说明
    /// </summary>
    public class CancelData : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "text/plain";
            context.Response.Write("{\"state\":\"ok\"}");
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