const option = {
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
  flowControl: "none",
};
let port;

//x y 云台 灯光 视角
let array = [127, 127, 20, 0, 1];

let temp;
let angle_roll;
let angle_pitch;
let left_linear_speed;
let right_linear_speed;

//获取 data 标签dom
const displayValue = document.getElementById("displayValue");
const videoElement = document.getElementById("video");
const canvasElement = document.getElementById("canvas");
const startButton = document.getElementById("startRecording");
const stopButton = document.getElementById("stopRecording");
const downloadLink = document.getElementById("downloadLink");

// 请求摄像头
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream; // 设置视频源
  })
  .catch((error) => {
    console.error("获取摄像头失败:", error);
  });

//连接usb
const connect = async () => {
  try {
    port = await navigator.serial.requestPort();

    await port.open(option);

    const { usbProductId, usbVendorId } = port.getInfo();
    console.log(usbProductId, usbVendorId);

    // 读取流
    const reader = port.readable.getReader();

    // 读取
    while (port.readable) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      const binaryArray = Array.from(value).map(
        (num) => num.toString(16).padStart(2, "0") // 获取十六进制数据
      );

      const temp_hex = binaryArray.slice(0, 4); //温度
      const angle_roll_hex = binaryArray.slice(4, 8); //角度
      const angle_pitch_hex = binaryArray.slice(8, 12); // 俯仰
      const left_linear_speed_hex = binaryArray.slice(12, 14); //左轮速度
      const right_linear_speed_hex = binaryArray.slice(14, 16); //右轮速度

      temp = hexToFloat(temp_hex);
      angle_roll = hexToFloat(angle_roll_hex);
      angle_pitch = hexToFloat(angle_pitch_hex);
      left_linear_speed = hexToFloat(left_linear_speed_hex);
      right_linear_speed = hexToFloat(right_linear_speed_hex);

      console.log(
        "temp:",
        temp,
        "angle_roll:",
        angle_roll,
        "angle_pitch:",
        angle_pitch,
        "left_linear_speed:",
        left_linear_speed,
        "right_linear_speed:",
        right_linear_speed
      );

      if (temp < 100 && temp > 2) {
        let str = `温度:${temp}角度:${angle_roll}° 俯仰:${angle_pitch}° 光线亮度:${array[3]}`;

        displayValue.textContent = str;
      }
    }
  } catch (error) {
    console.log("连接失败:", error);
  }
};

const hexToFloat = (hex) => {
  let buffer = new ArrayBuffer(4);
  let uint8Array = new Uint8Array(buffer);

  for (let i = 0; i < 4; i++) {
    uint8Array[i] = parseInt(hex[i], 16);
  }

  let dataView = new DataView(buffer);
  let floatValue = dataView.getFloat32(0, true);

  return floatValue.toFixed(2);
};

// 截图功能
const capture = () => {
  // 获取宽高
  const width = videoElement.videoWidth;
  const height = videoElement.videoHeight;

  canvasElement.width = width;
  canvasElement.height = height;

  // 获取canvas
  const context = canvasElement.getContext("2d");

  // 把video当前内容绘制到 canvas 上
  context.drawImage(videoElement, 0, 0, width, height);

  // 导出URL
  const imageUrl = canvasElement.toDataURL("image/png");

  //下载链接
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = "robot_photo.png";
  link.click(); // 自动下载
};

const change = async () => {
  if (port && port.writable) {
    const writer = port.writable.getWriter();

    const num = new Uint8Array(array);
    await writer.write(num);
    console.log("发送数据:", num);

    writer.releaseLock();
  } else {
    console.error("端口未打开或不可写");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connect").addEventListener("click", async () => {
    window.alert(
      "前进 w ，后退 s ，左转 a ，右转 d  ，摄像头抬头 q ，摄像头低头 e ，增加亮度 1 ，减少亮度 2 ，截图 Tab"
    );
    connect();
  });

  document.addEventListener("keydown", async (event) => {
    //前进
    if (event.key === "w") {
      if (array[1] < 255) {
        array[1] += 32;
      } else {
        array[1] = 255;
      }
      console.log(array);
      await change();
    }

    // 后退
    if (event.key === "s") {
      if (array[1] > 1) {
        array[1] -= 32;
      } else {
        array[1] = 0;
      }
      console.log(array);
      await change();
    }

    //左转
    if (event.key === "a") {
      if (array[0] > 1) {
        array[0] -= 32;
      } else {
        array[0] = 0;
      }
      console.log(array);
      await change();
    }

    //右转
    if (event.key === "d") {
      if (array[0] > 255) {
        array[0] += 32;
      } else {
        array[0] = 255;
      }
      console.log(array);
      await change();
    }

    //摄像头上升
    if (event.key === "q") {
      if (array[2] < 50) {
        array[2] += 1;
      } else {
        array[2] = 50;
      }
      console.log(array);
      await change();
    }

    //摄像头下降
    if (event.key === "e") {
      if (array[2] > 0) {
        array[2] -= 1;
      } else {
        array[2] = 0;
      }
      console.log(array);
      await change();
    }

    //切换视角
    if (event.key === "r") {
      array[4] = 0;
      await change();
    }

    //增加亮度
    if (event.key === "1") {
      if (array[3] >= 100) {
        array[3] = 100;
      } else {
        array[3] += 5;
      }

      await change();
    }

    //减少亮度
    if (event.key === "2") {
      if (array[3] <= 0) {
        array[3] = 0;
      } else {
        array[3] -= 5;
      }

      await change();
    }

    //截图
    if (event.key === "Tab") {
      capture();
    }
  });

  document.addEventListener("keyup", async (event) => {
    if (event.key === "w") {
      array[0] = 127;
      array[1] = 127;
      await change();

      console.log(array);
    }

    if (event.key === "s") {
      array[0] = 127;
      array[1] = 127;
      await change();
      console.log(array);
    }

    if (event.key === "a") {
      array[0] = 127;
      array[1] = 127;
      await change();
      console.log(array);
    }

    if (event.key === "d") {
      array[0] = 127;
      array[1] = 127;
      await change();
      console.log(array);
    }

    if (event.key === "r") {
      array[4] = 1;
      await change();
    }
  });

  //下载
  document.addEventListener("DOMContentLoaded", async () => {
    let mediaRecorder;
    let recordedChunks = [];

    // 获取摄像头
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoElement.srcObject = stream;

      mediaRecorder = new MediaRecorder(stream);

      // 处理数据
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      // 停止录制
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, {
          type: "video/webm",
        });
        recordedChunks = [];

        //下载链接
        const videoURL = URL.createObjectURL(blob);
        downloadLink.href = videoURL;
        downloadLink.download = "robot_video.webm";
        downloadLink.style.display = "block";
        downloadLink.textContent = "下载视频";
      };
    } catch (error) {
      console.error("无法获取摄像头", error);
    }

    // 开始录制
    startButton.addEventListener("click", () => {
      if (mediaRecorder && mediaRecorder.state === "inactive") {
        mediaRecorder.start();
        // console.log("开始录制...");
        startButton.disabled = true;
        stopButton.disabled = false;
      }
    });

    // 停止录制
    stopButton.addEventListener("click", () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        // console.log("停止录制...");
        startButton.disabled = false;
        stopButton.disabled = true;
      }
    });
  });
});
