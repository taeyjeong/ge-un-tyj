import zipfile,xml.etree.ElementTree as E,posixpath
N={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
def sheets(path):
 z=zipfile.ZipFile(path);strings=[]
 if 'xl/sharedStrings.xml' in z.namelist():strings=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',N)]
 rel={r.attrib['Id']:r.attrib['Target'] for r in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
 for s in E.fromstring(z.read('xl/workbook.xml')).findall('s:sheets/s:sheet',N):
  target=rel[s.attrib['{'+N['r']+'}id']];target=target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/'+target)
  rows=[]
  for row in E.fromstring(z.read(target)).findall('s:sheetData/s:row',N):
   values={}
   for c in row.findall('s:c',N):
    v=c.find('s:v',N);value=v.text if v is not None else ''
    if c.attrib.get('t')=='s':value=strings[int(value)] if value else ''
    elif c.attrib.get('t')=='inlineStr':value=''.join(c.find('s:is',N).itertext())
    elif value:
     try:value=float(value);value=int(value) if value.is_integer() else value
     except ValueError:pass
    values[c.attrib['r']]=value
   rows.append(values)
  yield s.attrib['name'],rows
if __name__=='__main__':
 import sys
 for p in sys.argv[1:]:
  print('\nFILE',p)
  for name,rows in sheets(p):
   print('SHEET',name,'rows',len(rows));print(*rows[:12],sep='\n')
