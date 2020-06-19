var http = require('http')
var stream = require('stream')
var readline = require('readline')
var fs = require('fs')

http.createServer((req, res) => {
    let body
    let readableStream
    req.res = res;
    req.on("data", onPosting).on("end", onPosted);

    // req.on('data', (chunk) => {
    //     body = chunk
    //     var bufferStream = new stream.PassThrough();
    //     bufferStream.end(chunk);

    //     var rl = readline.createInterface({
    //         input: bufferStream,
    //     });

    //     var count = 0;
    //     var fileValue
    //     rl.on('line', function (line) {
    //         ++count;
    //         if(count <= 3 || count === 204) {
    //             console.log('Linha de cabeçalho, nõ será escrita no arquivo', line);
    //         } else {
    //             fileValue += line
    //         }
    //         if (count === 204) {
    //             fs.writeFile('./teste.png', fileValue)
    //             // file.end();
    //         }
    //     });
    //     console.log(`body ${chunk}`)
    // });
    // req.on('end', () => {
    //     console.log('No more data in response.');
    // });
}).listen(8080, () => console.log('Listen on port 8080'))

function onPosting(data) {
    if (this.data) {
        this.data.fill(data, this.dataIndex);
        this.dataIndex += data.length;
    } else {
        var contentLength = +this.headers["content-length"];
        if (data.length === contentLength) {
            this.data = data;
        } else {
            this.data = Buffer.alloc(contentLength);
            this.data.fill(data);
            this.dataIndex = data.length;
        }
    }

}

function onPosted() {
    var boundary = extract(this.headers["content-type"], " boundary=");
    var form = parseForm(boundary, this.data);
    fs.writeFile(`./${form.file.filename}`, form.file.value)
    this.res.writeHead(200,
        {
            'Content-type': 'image/png',
            'Content-Disposition': `attachment; filename="${form.file.filename}"`
        }
        )
    this.res.write(form.file.value);
    this.res.end();
}

function extract(arr, start, end) {
    var useIndex = typeof start === "number",
        i,
        j;
    if (useIndex) {
        i = start;
        if (end) {
            j = arr.indexOf(end, i);
            return (j === -1) ? ["", -1] : [(i === j) ? "" : arr.slice(i, j), j + end.length];
        } else return arr.slice(i);
    } else {
        i = arr.indexOf(start);
        if (i !== -1) {
            i += start.length;
            if (end) {
                j = arr.indexOf(end, i);
                if (j !== -1) return arr.slice(i, j);
            } else return arr.slice(i);
        }
        return "";
    }
}

function parseForm(boundary, data) {
    var form = {},
        delimiter = Buffer.from("\r\n--" + boundary),
        body = extract(data, "--" + boundary + "\r\n"),
        CR = Buffer.from("\r\n\r\n"),
        i = 0,
        head,
        name,
        filename,
        value,
        obj;
    if (body) {
        while (i !== -1) {
            [head, i] = extract(body, i, CR);
            name = extract(head, '; name="', '"').toString();
            filename = extract(head, '; filename="', '"').toString();
            [value, i] = extract(body, i, delimiter);
            if (name) {
                obj = filename ? { filename, value } : { value };
                if (form.hasOwnProperty(name)) { // multiple 
                    if (Array.isArray(form[name])) {
                        form[name].push(obj);
                    } else {
                        form[name] = [form[name], obj];
                    }
                } else {
                    form[name] = obj;
                }
            }
            if (body[i] === 45 && body[i + 1] === 45) break; // "--"
            if (body[i] === 13 && body[i + 1] === 10) {
                i += 2; // "\r\n"
            } else {
                //error
            }
        }
    }
    return form;
}