module.exports.upload = async event => {

  var boundary = extract(event.headers["Content-Type"], " boundary=");
  var form = parseForm(boundary, Buffer.from(event.body));

  return {
    statusCode: 200,
    headers: {
      'Content-type': 'image/png',//you can change any content type
      'Content-Disposition': `attachment; filename="${form.file.filename}"` // key of success
    },
    body: form.file.value,
    isBase64Encoded: false
  };

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

};
