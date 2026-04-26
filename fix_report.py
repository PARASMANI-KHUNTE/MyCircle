lines = open('myreport.py', encoding='utf-8').readlines()

new_block = [
    '    _ts2 = TableStyle([("BOX",(0,0),(-1,-1),1.5,BLUE),("BACKGROUND",(0,0),(-1,-1),LGRAY),("ALIGN",(0,0),(-1,-1),"CENTER"),("VALIGN",(0,0),(-1,-1),"MIDDLE")])\n',
    '    _ps2 = ParagraphStyle("ph2b",parent=getSampleStyleSheet()["Normal"],fontSize=10,textColor=MGRAY,alignment=TA_CENTER)\n',
    '    for title, fig_label, desc in screens:\n',
    '        _t2 = Table([[Paragraph("[ " + fig_label + " ]\\nInsert Screenshot Here", _ps2)]],colWidths=[CONTENT_W],rowHeights=[100])\n',
    '        _t2.setStyle(_ts2)\n',
    '        story.append(KeepTogether([Paragraph(title, ST["h2"]), _t2, Spacer(1,0.1*cm)]))\n',
    '        story.append(Paragraph(desc, ST["body"]))\n',
]

lines[2159:2179] = new_block
open('myreport.py', 'w', encoding='utf-8').writelines(lines)
print('Done, new line count:', len(lines))
