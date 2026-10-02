const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const api = {};
new Function('exports', ts.transpileModule(fs.readFileSync('src/lib/photo-metadata.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(api);
test('formats original EXIF for the camera footer without duplicate manufacturer or undefined fields', () => {
 const result = api.photoExifFromTags({Make:'Canon', Model:'Canon EOS R8', FocalLength:105, FNumber:6.3, ExposureTime:1/640, ISO:640});
 assert.deepEqual(result,{camera:'Canon EOS R8',focalLength:'105mm',aperture:'f/6.3',shutter:'1/640s',iso:'ISO 640'});
 assert.deepEqual(api.photoExifFromTags(null),{});
 assert.deepEqual(api.photoExifFromTags({Make:'Sony',Model:'ILCE-7M4',ExposureTime:2}),{camera:'Sony ILCE-7M4',shutter:'2s'});
});
test('rounds raw and previously saved aperture values to one decimal place', () => {
 assert.equal(api.formatAperture(1.77999997138806), 'f/1.8');
 assert.equal(api.formatAperture('f/1.77999997138806'), 'f/1.8');
 assert.equal(api.formatAperture(8), 'f/8.0');
 assert.equal(api.formatAperture(undefined), '');
});

test('rounds raw and previously saved focal lengths for the camera footer', () => {
 assert.equal(api.formatFocalLength(6.764999865652793), '6.8mm');
 assert.equal(api.formatFocalLength('6.764999865652793mm'), '6.8mm');
 assert.equal(api.formatFocalLength('105mm'), '105mm');
 assert.equal(api.formatFocalLength(undefined), '');
});

test('keeps lens model, physical focal length and 35mm equivalent separate', () => {
 const result = api.photoExifFromTags({LensModel:'iPhone back triple camera', FocalLength:6.764999865652793, FocalLengthIn35mmFilm:48});
 assert.deepEqual(result, {lens:'iPhone back triple camera', focalLength:'6.8mm', focalLength35mm:'48mm'});
 assert.deepEqual(api.photoExifFromTags({FocalLengthIn35mmFilm:0}), {});
});

test('chooses focal length by device and supports manual classification', () => {
 const values = {focalLength:'6.8mm', focalLength35mm:'48mm'};
 assert.equal(api.formatPhotoFocalLength({...values, camera:'Apple iPhone 15 Pro Max'}), '48mm');
 assert.equal(api.formatPhotoFocalLength({...values, camera:'Samsung SM-S918N'}), '48mm');
 assert.equal(api.formatPhotoFocalLength({camera:'Canon EOS R8', focalLength:'24mm', focalLength35mm:'24mm'}), '24mm');
 assert.equal(api.formatPhotoFocalLength({...values, deviceType:'mobile', camera:'Unknown phone'}), '48mm');
 assert.equal(api.formatPhotoFocalLength({...values, deviceType:'camera', camera:'Apple iPhone'}), '6.8mm');
 assert.equal(api.formatPhotoFocalLength({camera:'iPhone', focalLength:'6.8mm'}), '');
 assert.equal(api.formatPhotoFocalLength(undefined), '');
});

test('reads the actual exifr 35mm equivalent tag name', () => {
 const exifr = require('exifr');
 const tag = exifr.tagKeys.get('exif').get(41989);
 assert.equal(tag, 'FocalLengthIn35mmFormat');
 const result = api.photoExifFromTags({Model:'iPhone 15 Pro Max', FocalLength:6.765, [tag]:48});
 assert.equal(result.focalLength35mm, '48mm');
 assert.equal(api.formatPhotoFocalLength(result), '48mm');
});
