/*
 * QDReader Cookie 同步青龙
 * Loon + BoxJS + 青龙
 */

const ENV_NAME = "QDREADER_COOKIE";

const QL_HOST = $persistentStore.read("yuheng_ql_host");
const CLIENT_ID = $persistentStore.read("yuheng_ql_clientid");
const CLIENT_SECRET = $persistentStore.read("yuheng_ql_clientsecret");

const COOKIE = $persistentStore.read(ENV_NAME);


(async () => {

  if (!COOKIE) {
    throw new Error("未找到 QDREADER_COOKIE");
  }

  if (!QL_HOST || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("青龙配置不存在");
  }


  let host = QL_HOST;

  if (!host.startsWith("http")) {
    host = "http://" + host;
  }

  if (!host.endsWith("/")) {
    host += "/";
  }


  // 获取 Token
  const tokenResult = await httpRequest({
    url:
      host +
      "open/auth/token?client_id=" +
      encodeURIComponent(CLIENT_ID) +
      "&client_secret=" +
      encodeURIComponent(CLIENT_SECRET),

    method: "GET"
  });


  if (!tokenResult.data?.token) {
    throw new Error(
      "获取Token失败：" +
      JSON.stringify(tokenResult)
    );
  }


  const token =
    tokenResult.data.token_type
      ? tokenResult.data.token_type +
        " " +
        tokenResult.data.token
      :
        "Bearer " +
        tokenResult.data.token;



  // 获取环境变量

  const envList = await httpRequest({

    url: host + "open/envs",

    method:"GET",

    headers:{
      Authorization:token
    }

  });


  if (!Array.isArray(envList.data)) {

    throw new Error(
      "读取环境变量失败：" +
      JSON.stringify(envList)
    );

  }



  const old = envList.data.find(
    e => e.name === ENV_NAME
  );



  if (old) {


    // 更新

    const update = await httpRequest({

      url: host + "open/envs",

      method:"PUT",

      headers:{
        Authorization:token,
        "Content-Type":"application/json"
      },

      body:JSON.stringify({

        id: old.id || old._id,

        name:ENV_NAME,

        value:COOKIE,

        remarks:"起点读书"

      })

    });



    if(update.code !== 200){

      throw new Error(
        "更新失败：" +
        JSON.stringify(update)
      );

    }



    // 启用变量

    await httpRequest({

      url:host+"open/envs/enable",

      method:"PUT",

      headers:{
        Authorization:token,
        "Content-Type":"application/json"
      },

      body:JSON.stringify([
        old.id || old._id
      ])

    });



    $notification.post(
      "起点同步青龙",
      "成功",
      "QDREADER_COOKIE 已更新"
    );


  } else {



    // 创建

    const add = await httpRequest({

      url:host+"open/envs",

      method:"POST",

      headers:{
        Authorization:token,
        "Content-Type":"application/json"
      },


      body:JSON.stringify([

        {

          name:ENV_NAME,

          value:COOKIE,

          remarks:"起点读书"

        }

      ])

    });



    if(add.code !== 200){

      throw new Error(
        "创建失败：" +
        JSON.stringify(add)
      );

    }



    $notification.post(
      "起点同步青龙",
      "成功",
      "QDREADER_COOKIE 已创建"
    );

  }


})()
.catch(e=>{

  console.log(e);

  $notification.post(
    "起点同步青龙",
    "失败",
    e.message || e
  );

})
.finally(()=>{

  $done();

});





function httpRequest(opt){

  return new Promise((resolve,reject)=>{


    $httpClient[opt.method.toLowerCase()](opt,

      (err,resp,body)=>{


        if(err){

          reject(err);

          return;

        }


        try{

          resolve(JSON.parse(body));

        }catch(e){

          reject(
            "JSON解析失败："+body
          );

        }

      });


  });


}
