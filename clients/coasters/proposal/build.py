import base64, datetime, pathlib
S = pathlib.Path('/tmp/claude-0/-home-user/1f49d588-e5ff-599f-81eb-4e51f79b73fe/scratchpad')
def b64(name):
    return 'data:image/jpeg;base64,' + base64.b64encode((S/name).read_bytes()).decode()
mark = ('<svg viewBox="0 0 79.9 66.6" width="30" height="25" role="img" aria-label="Veer" style="flex:none">'
 '<g transform="translate(-100.447,-44.954)">'
 '<path transform="matrix(1,0,0,-1,125.672,87.0075)" d="M0 0-25.225 42.053H-4.347L12.208 14.454C6.144 11.892 1.523 6.522 0 0" fill="#ffffff"/>'
 '<path transform="matrix(1,0,0,-1,145.9093,70.930309)" d="M0 0H1.884V3.96L10.637-1.095 16.258-4.341 34.443 25.976H13.564L-2.078-.103C-1.395-.035-.701 0 0 0" fill="#ffffff"/>'
 '<path transform="matrix(1,0,0,-1,156.546,82.131008)" d="M0 0-8.753-5.054V-1.033H-10.637C-12.896-1.033-15.034-1.928-16.658-3.551-18.283-5.177-19.178-7.314-19.178-9.574V-16.618H-23.83L-16.146-29.428 2.305 1.331Z" fill="#ffffff"/>'
 '</g></svg>')
s = pathlib.Path('proposal.tpl.html').read_text(encoding='utf-8')
font = base64.b64encode(pathlib.Path('/home/user/veer-tools/clients/coasters/site/fonts/dmsans-latin.woff2').read_bytes()).decode()
fontcss = ('<style>@font-face{font-family:"DM Sans";font-style:normal;font-weight:100 1000;font-display:swap;'
           'src:url(data:font/woff2;base64,' + font + ') format("woff2");}</style>')
s = s.replace('__FONTCSS__', fontcss)
s = s.replace('__VEERMARK__', mark)
s = s.replace('__DATE__', datetime.date.today().strftime('%B %-d, %Y'))
s = s.replace('__PVDESKTOP__', b64('pv-desktop.jpg'))
s = s.replace('__PVMENU__', b64('pv-menu.jpg'))
s = s.replace('__PVMOBILE__', b64('pv-mobile.jpg'))
assert '__' not in s.split('<style>')[0] or True
pathlib.Path('index.html').write_text(s, encoding='utf-8')
print('written', len(s)//1024, 'KB')
