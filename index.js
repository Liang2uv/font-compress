const fonts = require('@hayes0724/web-font-converter/src/lib/fonts')
const fontSpider = require('font-spider');
const fs = require('fs')
const path = require('path')

function readdir() {
  return new Promise((resolve, reject) => {
    fs.readdir(path.join(__dirname, 'fonts'), (err, files) => {
      if (err) {
        reject('获取目录失败');
        return;
      }
      resolve(files.filter(v => v.endsWith('.otf') || v.endsWith('.ttf') || v.endsWith('.TTF') || v.endsWith('.OTF')))
    });
  })
}

function otf2ttf(filename) {
  return new Promise((resolve, reject) => {
    try {
      fonts.otf.convert.ttf(path.join(__dirname, `fonts/${filename}`), path.join(__dirname, `fonts/${filename.replace('.otf', '.ttf').replace('.OTF', '.TTF')}`))
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

function convert(files) {
  return new Promise((resolve, reject) => {
    const ps = files.filter(v => v.endsWith('.otf') || v.endsWith('.OTF')).map(item => {
      return otf2ttf(item)
    })
    Promise.all(ps).then(() => {
      resolve();
    }).catch(() => {
      reject();
    })
  })
}

function del(name) {
  return new Promise((resolve, reject) => {
    fs.unlink(path.join(__dirname, `fonts/${name}`), err => {
      if (err) {
        reject(err)
        return;
      }
      resolve();
    })
  })
}

function delFile() {
  return new Promise((resolve, reject) => {
    readdir().then(files => {
      const ps = files.filter(v => v.endsWith('.otf') || v.endsWith('.OTF')).map(v => del(v));
      Promise.all(ps).then(() => {
        resolve();
      }).catch(() => {
        reject();
      })
    }).catch(() => {
      reject();
    })
  })
}

function html() {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, '需要抽取的文字.txt'), 'utf8', function (err, str) {
      if (err) {
        reject(err)
        return;
      }
      readdir().then(files => {
        const fontface = files.map(v => `@font-face {
          font-family: "${v.replace('.ttf', '').replace('.TTF', '')}";
          src: url("./fonts/${v}");
        }`).join('')
        const content = files.map(v => `<p style="font-family: '${v.replace('.ttf', '').replace('.TTF', '')}';">${str}</p><p style="font-family: '${v.replace('.ttf', '').replace('.TTF', '')}';">1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()-=_+[]{}\\|;\':",.<>//?¥³²</p>`).join('')
        resolve(`<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
        </head>
        <style>
          ${fontface}
        </style>
        <body>
          ${content}
        </body>
        </html>`)
      })
    })
  })
}

function htmlWrite(html) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.join(__dirname, 'index.html'), html, 'utf8', (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    })
  })
}

function compress() {
  return new Promise((resolve, reject) => {
    fontSpider.spider([__dirname + '/index.html'], {
      silent: false
    }).then(function(webFonts) {
      return fontSpider.compressor(webFonts, {backup: true});
    }).then(function(webFonts) {
      resolve();
    }).catch(function(errors) {
      reject();
    });
  })
}

readdir().then(files => {
  console.log('otf转ttf中...')
  return convert(files)
}).then(() => {
  console.log('已把全部otf文件转为ttf')
  return delFile()
}).then(() => {
  return html()
}).then(html => {
  console.log('正在写入html')
  return htmlWrite(html)
}).then(() => {
  console.log('写入html完毕')
  console.log('开始压缩字体文件...')
  return compress()
}).then(() => {
  console.log('已压缩，请在fonts文件夹查看')
});
