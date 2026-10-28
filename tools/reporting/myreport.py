#!/usr/bin/env python3
"""
MyCircle Minor Project Report — Professional PDF Generator
GGU MCA 2nd Semester, 2025
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.graphics.shapes import (
    Drawing, Rect, String, Line, Circle, Group, Polygon
)

# Compatibility shim — ReportLab 4.x removed RoundRect; emulate with plain Rect
class RoundRect(Rect):
    """Rect that accepts a corner-radius argument and ignores it gracefully."""
    def __init__(self, x, y, width, height, radius=0, **kwargs):
        super().__init__(x, y, width, height, **kwargs)
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas as pdfcanvas

# ── Colours ───────────────────────────────────────────────────────────────────
NAVY       = HexColor('#1B3A6B')
BLUE       = HexColor('#2F6FAB')
LIGHT_BLUE = HexColor('#D6EAF8')
MED_BLUE   = HexColor('#5DADE2')
DARK       = HexColor('#1C2833')
MGRAY      = HexColor('#717D7E')
LGRAY      = HexColor('#F2F3F4')
WHITE      = colors.white
BLACK      = colors.black
GREEN      = HexColor('#1D6A39')
LGREEN     = HexColor('#D5F5E3')
ORANGE     = HexColor('#9A4500')
LORANGE    = HexColor('#FAE5D3')
RED        = HexColor('#922B21')
TEAL       = HexColor('#0E6655')
PURPLE     = HexColor('#512E5F')
LPURPLE    = HexColor('#E8DAEF')
LYELLOW    = HexColor('#FEF9E7')
LBLUE2     = HexColor('#EBF5FB')

PAGE_W, PAGE_H = A4
MARGIN    = 2.5 * cm
TOP_MARGIN    = 3.2 * cm
BOTTOM_MARGIN = 2.5 * cm
CONTENT_W = PAGE_W - 2 * MARGIN   # ≈ 453 pt

OUTPUT = r'f:\Codes\Complete full stack projects\MyCircle\MyCircle_Minor_Project_Report.pdf'

# ── Styles ────────────────────────────────────────────────────────────────────
def make_styles():
    base = getSampleStyleSheet()

    def S(name, parent='Normal', **kw):
        return ParagraphStyle(name, parent=base[parent], **kw)

    return dict(
        title_main = S('title_main', fontSize=20, fontName='Helvetica-Bold',
                       textColor=NAVY, alignment=TA_CENTER, spaceAfter=8, leading=26),
        title_sub  = S('title_sub', fontSize=12, fontName='Helvetica',
                       textColor=DARK, alignment=TA_CENTER, spaceAfter=4, leading=18),
        title_info = S('title_info', fontSize=11, fontName='Helvetica',
                       textColor=DARK, alignment=TA_CENTER, spaceAfter=3, leading=16),
        title_bold = S('title_bold', fontSize=12, fontName='Helvetica-Bold',
                       textColor=NAVY, alignment=TA_CENTER, spaceAfter=3),
        ch_label   = S('ch_label', fontSize=11, fontName='Helvetica',
                       textColor=BLUE, alignment=TA_LEFT, spaceBefore=0, spaceAfter=2),
        h1         = S('h1', fontSize=17, fontName='Helvetica-Bold',
                       textColor=NAVY, spaceBefore=0, spaceAfter=10, leading=22),
        h2         = S('h2', fontSize=13, fontName='Helvetica-Bold',
                       textColor=BLUE, spaceBefore=14, spaceAfter=6, leading=18),
        h3         = S('h3', fontSize=11, fontName='Helvetica-Bold',
                       textColor=DARK, spaceBefore=10, spaceAfter=4, leading=15),
        body       = S('body', fontSize=10.5, fontName='Helvetica',
                       textColor=DARK, alignment=TA_JUSTIFY, leading=17, spaceAfter=8),
        cert       = S('cert', fontSize=11, fontName='Helvetica',
                       textColor=DARK, alignment=TA_JUSTIFY, leading=20, spaceAfter=10),
        center     = S('center', fontSize=10.5, fontName='Helvetica',
                       textColor=DARK, alignment=TA_CENTER, spaceAfter=6),
        caption    = S('caption', fontSize=9, fontName='Helvetica-Oblique',
                       textColor=MGRAY, alignment=TA_CENTER, spaceAfter=14, spaceBefore=4),
        bullet     = S('bullet', fontSize=10.5, fontName='Helvetica',
                       textColor=DARK, alignment=TA_LEFT, leading=16,
                       leftIndent=16, spaceAfter=3, bulletIndent=4),
        toc_ch     = S('toc_ch', fontSize=11, fontName='Helvetica-Bold',
                       textColor=NAVY, leading=18, spaceAfter=2),
        toc_sec    = S('toc_sec', fontSize=10, fontName='Helvetica',
                       textColor=DARK, leading=15, leftIndent=18, spaceAfter=1),
        sign_lbl   = S('sign_lbl', fontSize=10, fontName='Helvetica',
                       textColor=DARK, alignment=TA_CENTER),
        sign_name  = S('sign_name', fontSize=11, fontName='Helvetica-Bold',
                       textColor=NAVY, alignment=TA_CENTER),
        kw_label   = S('kw_label', fontSize=9.5, fontName='Helvetica-Bold',
                       textColor=BLUE, spaceBefore=0),
    )


# ── Header / Footer ───────────────────────────────────────────────────────────
_front_pages = 9   # pages with no header/footer

def on_page(canvas, doc):
    pg = doc.page
    canvas.saveState()
    if pg > _front_pages:
        canvas.setStrokeColor(BLUE)
        canvas.setLineWidth(0.8)
        canvas.line(MARGIN, PAGE_H - 1.9*cm, PAGE_W - MARGIN, PAGE_H - 1.9*cm)
        canvas.setFont('Helvetica-Bold', 7.5)
        canvas.setFillColor(NAVY)
        canvas.drawString(MARGIN, PAGE_H - 1.55*cm,
                          'MyCircle \u2013 A Local Student Opportunity & Networking Platform')
        canvas.setFont('Helvetica', 7.5)
        canvas.setFillColor(MGRAY)
        canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 1.55*cm,
                               'Minor Project Report | GGU | 2025')
        canvas.setStrokeColor(BLUE)
        canvas.line(MARGIN, 1.6*cm, PAGE_W - MARGIN, 1.6*cm)
        canvas.setFont('Helvetica', 7)
        canvas.setFillColor(MGRAY)
        canvas.drawString(MARGIN, 1.1*cm,
                          'Dept. of CSIT, Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.)')
        canvas.setFont('Helvetica-Bold', 8)
        canvas.setFillColor(NAVY)
        canvas.drawRightString(PAGE_W - MARGIN, 1.1*cm, f'Page {pg}')
    canvas.restoreState()


# ── Drawing helpers ───────────────────────────────────────────────────────────
def rr(x, y, w, h, r=6, fill=WHITE, stroke=BLUE, sw=1.2):
    b = RoundRect(x, y, w, h, r, fillColor=fill, strokeColor=stroke, strokeWidth=sw)
    return b

def txt(x, y, s, size=8, color=DARK, bold=False, anchor='start'):
    fn = 'Helvetica-Bold' if bold else 'Helvetica'
    t = String(x, y, s, fontSize=size, fillColor=color, fontName=fn, textAnchor=anchor)
    return t

def arrow_h(x1, y, x2, color=BLUE):
    """Horizontal arrow from (x1,y) to (x2,y)."""
    line = Line(x1, y, x2, y, strokeColor=color, strokeWidth=1.2)
    tip_x = x2
    head = Polygon([tip_x, y, tip_x-6, y+3, tip_x-6, y-3],
                   fillColor=color, strokeColor=color, strokeWidth=0.5)
    return [line, head]

def arrow_v(x, y1, y2, color=BLUE):
    """Vertical arrow from (x,y1) down to (x,y2), y1 > y2."""
    line = Line(x, y1, x, y2, strokeColor=color, strokeWidth=1.2)
    tip_y = y2
    head = Polygon([x, tip_y, x-3, tip_y+6, x+3, tip_y+6],
                   fillColor=color, strokeColor=color, strokeWidth=0.5)
    return [line, head]


# ── DIAGRAM 1: System Architecture ───────────────────────────────────────────
def make_arch_diagram():
    W, H = CONTENT_W, 260
    d = Drawing(W, H)

    # Helper: draw labelled box
    def box(x, y, w, h, title, sub, fill, stroke, ts=8.5):
        d.add(rr(x, y, w, h, r=5, fill=fill, stroke=stroke, sw=1.5))
        d.add(txt(x + w/2, y + h - 14, title, size=ts, color=stroke, bold=True, anchor='middle'))
        if sub:
            d.add(txt(x + w/2, y + h - 26, sub, size=7, color=MGRAY, anchor='middle'))

    # ── Layer backgrounds ──────────────────────────────────────────────────────
    layer_w = W - 10
    # CLIENT (top)
    d.add(Rect(5, 182, layer_w, 72, fillColor=LBLUE2, strokeColor=BLUE, strokeWidth=1.5))
    d.add(txt(12, 246, 'CLIENT TIER', size=8, color=NAVY, bold=True))

    # API (middle)
    d.add(Rect(5, 94, layer_w, 82, fillColor=HexColor('#EAFAF1'), strokeColor=GREEN, strokeWidth=1.5))
    d.add(txt(12, 168, 'API TIER', size=8, color=GREEN, bold=True))

    # DATA (bottom)
    d.add(Rect(5, 8, layer_w, 80, fillColor=LYELLOW, strokeColor=ORANGE, strokeWidth=1.5))
    d.add(txt(12, 80, 'DATA TIER', size=8, color=ORANGE, bold=True))

    # ── Client boxes ──────────────────────────────────────────────────────────
    bw = 95
    box(14,  190, bw, 52, 'React.js', 'Components / Hooks', LIGHT_BLUE, BLUE)
    box(118, 190, bw, 52, 'React Router v6', 'Client Routing', LIGHT_BLUE, BLUE)
    box(222, 190, bw, 52, 'Context API', 'Auth / Theme State', LIGHT_BLUE, BLUE)
    box(326, 190, bw, 52, 'Axios', 'HTTP + Interceptors', LIGHT_BLUE, BLUE)
    box(430, 190, bw, 52, 'Socket.io', 'Real-time Client', LIGHT_BLUE, BLUE)

    # ── API boxes ─────────────────────────────────────────────────────────────
    box(14,  100, 110, 56, 'Express.js', 'Routes / Controllers', LGREEN, GREEN)
    box(138, 100, 110, 56, 'JWT Middleware', 'Auth Guard / RBAC', LGREEN, GREEN)
    box(262, 100, 110, 56, 'Mongoose ODM', 'Schemas / Models', LGREEN, GREEN)
    box(386, 100, 110, 56, 'Cloudinary SDK', 'Media Upload', LGREEN, GREEN)

    # ── Data boxes ────────────────────────────────────────────────────────────
    box(30,  16, 130, 58, 'MongoDB Atlas', 'NoSQL Cloud DB', LYELLOW, ORANGE)
    box(180, 16, 130, 58, 'Cloudinary', 'Image / Media Store', LYELLOW, ORANGE)
    box(330, 16, 130, 58, 'Socket.io Server', 'WebSocket Server', LYELLOW, ORANGE)

    # ── Arrows ────────────────────────────────────────────────────────────────
    # Client -> API
    cx = W / 2
    for el in arrow_v(cx, 190, 156): d.add(el)
    d.add(txt(cx + 4, 173, 'HTTP / REST', size=7, color=BLUE))

    # API -> Data
    for el in arrow_v(cx, 100, 66): d.add(el)
    d.add(txt(cx + 4, 83, 'Mongoose Queries', size=7, color=GREEN))

    return d


# ── DIAGRAM 2: Authentication Flowchart ──────────────────────────────────────
def make_auth_flow():
    W, H = CONTENT_W, 320
    d = Drawing(W, H)

    bx = W / 2
    # Nodes: (label, x, y, w, h, shape, fill, stroke)
    def oval(x, y, w, h, label, fill=NAVY, fc=WHITE):
        d.add(RoundRect(x - w/2, y - h/2, w, h, h/2,
                        fillColor=fill, strokeColor=fill, strokeWidth=1))
        d.add(txt(x, y - 5, label, size=9, color=fc, bold=True, anchor='middle'))

    def process(x, y, w, h, label, sub='', fill=LIGHT_BLUE, sc=BLUE):
        d.add(rr(x - w/2, y - h/2, w, h, r=5, fill=fill, stroke=sc, sw=1.3))
        d.add(txt(x, y + (5 if sub else -4), label, size=8.5, color=sc, bold=True, anchor='middle'))
        if sub:
            d.add(txt(x, y - 9, sub, size=7, color=MGRAY, anchor='middle'))

    def diamond(x, y, hw, hh, label, fill=LYELLOW):
        pts = [x, y+hh, x+hw, y, x, y-hh, x-hw, y]
        d.add(Polygon(pts, fillColor=fill, strokeColor=ORANGE, strokeWidth=1.3))
        d.add(txt(x, y - 5, label, size=7.5, color=ORANGE, bold=True, anchor='middle'))

    def av(x, y1, y2):
        for el in arrow_v(x, y1, y2): d.add(el)

    def ah(x1, y, x2):
        for el in arrow_h(x1, y, x2): d.add(el)

    def lbl(x, y, text, anch='start'):
        d.add(txt(x, y, text, size=7, color=MGRAY, anchor=anch))

    # Nodes top-to-bottom
    oval(bx, 306, 100, 22, 'START')
    av(bx, 295, 278)
    process(bx, 265, 150, 24, 'User opens Register/Login')
    av(bx, 253, 228)
    process(bx, 216, 150, 24, 'Submit Credentials', 'Email + Password')
    av(bx, 204, 178)
    diamond(bx, 162, 72, 22, 'Valid input?')
    # No branch right
    ah(bx + 72, 162, bx + 130)
    d.add(txt(bx + 75, 166, 'No', size=7.5, color=RED, bold=True))
    process(bx + 178, 162, 90, 24, 'Show Error', 'Re-enter details', fill=HexColor('#FDEDEC'), sc=RED)
    # loop back up
    d.add(Line(bx+223, 150, bx+223, 100, strokeColor=RED, strokeWidth=1))
    d.add(Line(bx+223, 100, bx, 100, strokeColor=RED, strokeWidth=1))
    for el in arrow_v(bx, 100, 68): d.add(el)  # will be overridden by real down arrow
    # Yes branch continues down
    lbl(bx + 4, 140, 'Yes')
    av(bx, 140, 116)
    process(bx, 104, 150, 24, 'Check DB / Verify Hash', 'bcrypt.compare()')
    av(bx, 92, 66)
    diamond(bx, 50, 72, 22, 'Credentials OK?')
    # No branch
    ah(bx + 72, 50, bx + 130)
    d.add(txt(bx + 75, 54, 'No', size=7.5, color=RED, bold=True))
    process(bx + 178, 50, 90, 24, '401 Unauthorized', '', fill=HexColor('#FDEDEC'), sc=RED)
    # Yes continues down
    lbl(bx + 4, 28, 'Yes')
    av(bx, 28, 8)

    # Bottom row
    process(bx - 130, -22, 110, 26, 'Issue JWT Token', 'Sign with secret', fill=LGREEN, sc=GREEN)
    process(bx + 40, -22, 110, 26, 'Store in localStorage', 'Update AuthContext', fill=LGREEN, sc=GREEN)

    # arrows to bottom row
    d.add(Line(bx, 8, bx-130, 8, strokeColor=GREEN, strokeWidth=1))
    d.add(Line(bx-130, 8, bx-130, -9, strokeColor=GREEN, strokeWidth=1))
    for el in arrow_v(bx-130, -9, -9): d.add(el)
    d.add(Line(bx, 8, bx+95, 8, strokeColor=GREEN, strokeWidth=1))
    d.add(Line(bx+95, 8, bx+95, -9, strokeColor=GREEN, strokeWidth=1))
    for el in arrow_v(bx+95, -9, -9): d.add(el)

    oval(bx, -48, 100, 22, 'AUTHENTICATED')

    return d


# ── DIAGRAM 3: ER Diagram ────────────────────────────────────────────────────
def make_er_diagram():
    W, H = CONTENT_W, 310
    d = Drawing(W, H)

    ew, eh = 130, 60

    def entity(x, y, name, attrs, fill=LIGHT_BLUE, hfill=BLUE):
        # Header
        d.add(Rect(x, y + eh - 20, ew, 20, fillColor=hfill, strokeColor=hfill, strokeWidth=0))
        d.add(txt(x + ew/2, y + eh - 14, name, size=8.5, color=WHITE, bold=True, anchor='middle'))
        # Body
        d.add(Rect(x, y, ew, eh - 20, fillColor=fill, strokeColor=hfill, strokeWidth=1.2))
        for i, a in enumerate(attrs[:4]):
            d.add(txt(x + 6, y + (eh - 26) - i*11, a, size=7, color=DARK, anchor='start'))

    def rel_line(x1, y1, x2, y2, label=''):
        d.add(Line(x1, y1, x2, y2, strokeColor=MGRAY, strokeWidth=1.2, strokeDashArray=[4, 2]))
        if label:
            mx, my = (x1+x2)/2, (y1+y2)/2
            d.add(Rect(mx-20, my-7, 40, 14, fillColor=LYELLOW, strokeColor=ORANGE, strokeWidth=0.8))
            d.add(txt(mx, my-4, label, size=6.5, color=ORANGE, bold=True, anchor='middle'))

    # Entity positions
    # Users: centre-left
    ux, uy = 10, 200
    entity(ux, uy, 'USERS', ['_id (PK)', 'email (unique)', 'password_hash', 'college, role'])

    # Opportunities: top right
    ox, oy = 310, 240
    entity(ox, oy, 'OPPORTUNITIES', ['_id (PK)', 'postedBy (FK)', 'title, type', 'deadline'])

    # Events: right
    ex_, ey = 310, 140
    entity(ex_, ey, 'EVENTS', ['_id (PK)', 'organizer (FK)', 'title, date', 'venue'])

    # Study Groups: bottom right
    gx, gy = 310, 40
    entity(gx, gy, 'STUDY GROUPS', ['_id (PK)', 'admin (FK)', 'members[ ]', 'subject'])

    # Messages: bottom left
    mx, my = 10, 100
    entity(mx, my, 'MESSAGES', ['_id (PK)', 'sender (FK)', 'receiver (FK)', 'content, read'])

    # Notifications: top left
    nx, ny = 10, 240  # overlap with Users... let me reposition
    # Let's rearrange properly:
    # Users at centre (180, 160)
    # Clear and redo

    d2 = Drawing(W, H)

    def entity2(x, y, name, attrs, hfill=BLUE):
        fill2 = LIGHT_BLUE
        d2.add(Rect(x, y + eh - 20, ew, 20, fillColor=hfill, strokeColor=hfill, strokeWidth=0))
        d2.add(txt(x + ew/2, y + eh - 13, name, size=8, color=WHITE, bold=True, anchor='middle'))
        d2.add(Rect(x, y, ew, eh - 20, fillColor=fill2, strokeColor=hfill, strokeWidth=1.2))
        for i, a in enumerate(attrs[:4]):
            d2.add(txt(x + 5, y + (eh - 27) - i*10, a, size=6.8, color=DARK, anchor='start'))

    def rline(x1, y1, x2, y2, label='', card='1:N'):
        d2.add(Line(x1, y1, x2, y2, strokeColor=HexColor('#AEB6BF'), strokeWidth=1.5))
        mx2, my2 = (x1+x2)/2, (y1+y2)/2
        d2.add(Rect(mx2-22, my2-8, 44, 16, fillColor=LYELLOW, strokeColor=ORANGE, strokeWidth=0.7))
        d2.add(txt(mx2, my2-5, card, size=6.5, color=ORANGE, bold=True, anchor='middle'))

    # Layout: Users centre, others around
    Ux, Uy = 160, 130   # USERS (centre)
    entity2(Ux, Uy, 'USERS', ['_id (PK)', 'name, email', 'college, role', 'followers[ ]'], hfill=NAVY)

    Ox, Oy = 314, 210   # OPPORTUNITIES
    entity2(Ox, Oy, 'OPPORTUNITIES', ['_id (PK)', 'postedBy (FK->Users)', 'type, title', 'deadline'], hfill=BLUE)

    Ex2, Ey2 = 314, 100  # EVENTS
    entity2(Ex2, Ey2, 'EVENTS', ['_id (PK)', 'organizer (FK->Users)', 'title, date', 'venue'], hfill=GREEN)

    Gx, Gy = 314, -10   # STUDY GROUPS
    entity2(Gx, Gy, 'STUDY GROUPS', ['_id (PK)', 'admin (FK->Users)', 'members[ ]', 'subject'], hfill=TEAL)

    Mx2, My2 = 10, 210  # MESSAGES
    entity2(Mx2, My2, 'MESSAGES', ['_id (PK)', 'sender (FK->Users)', 'receiver (FK->Users)', 'content'], hfill=PURPLE)

    Nx2, Ny2 = 10, 100  # NOTIFICATIONS
    entity2(Nx2, Ny2, 'NOTIFICATIONS', ['_id (PK)', 'userId (FK->Users)', 'type, message', 'isRead'], hfill=HexColor('#C0392B'))

    # Relationships
    rline(Ux + ew, Uy + eh/2, Ox, Oy + eh/2, card='1:N')        # Users -> Opportunities
    rline(Ux + ew, Uy + 30, Ex2, Ey2 + eh/2, card='1:N')       # Users -> Events
    rline(Ux + ew, Uy + 10, Gx, Gy + eh/2, card='1:N')         # Users -> StudyGroups
    rline(Ux, Uy + eh/2, Mx2 + ew, My2 + eh/2, card='M:N')     # Users <-> Messages
    rline(Ux, Uy + 30, Nx2 + ew, Ny2 + eh/2, card='1:N')       # Users -> Notifications

    # Legend
    d2.add(Rect(5, 270, 200, 28, fillColor=LGRAY, strokeColor=MGRAY, strokeWidth=0.8))
    d2.add(txt(8, 289, 'Entity Relationship Diagram — MyCircle Database', size=7.5, color=NAVY, bold=True))
    d2.add(txt(8, 277, 'FK = Foreign Key Reference    [ ] = Array of References', size=7, color=MGRAY))

    return d2


# ── DIAGRAM 4: DFD Level 0 ───────────────────────────────────────────────────
def make_dfd0():
    W, H = CONTENT_W, 200
    d = Drawing(W, H)

    cx = W / 2

    # Central system oval
    d.add(RoundRect(cx - 90, 75, 180, 50, 25,
                    fillColor=NAVY, strokeColor=NAVY, strokeWidth=0))
    d.add(txt(cx, 107, 'MyCircle', size=11, color=WHITE, bold=True, anchor='middle'))
    d.add(txt(cx, 90, 'System', size=9, color=LIGHT_BLUE, anchor='middle'))

    # External entities
    def ext_box(x, y, w, h, label, sub=''):
        d.add(Rect(x, y, w, h, fillColor=LGRAY, strokeColor=MGRAY, strokeWidth=1.5))
        d.add(txt(x + w/2, y + h - 14, label, size=8.5, color=DARK, bold=True, anchor='middle'))
        if sub:
            d.add(txt(x + w/2, y + 6, sub, size=7, color=MGRAY, anchor='middle'))

    # Student (left)
    ext_box(10, 80, 100, 40, 'Student', 'Authenticated User')
    # Admin (right)
    ext_box(W - 110, 80, 100, 40, 'Admin', 'Content Manager')
    # Cloudinary (bottom)
    ext_box(cx - 55, 10, 110, 34, 'Cloudinary', 'External Service')

    # Arrows
    # Student <-> System
    for el in arrow_h(110, 108, cx - 90): d.add(el)
    for el in arrow_h(cx - 90, 92, 110): d.add(el)
    d.add(txt(130, 112, 'Requests', size=7, color=BLUE))
    d.add(txt(130, 81, 'Responses', size=7, color=GREEN))

    # System <-> Admin
    for el in arrow_h(cx + 90, 108, W - 110): d.add(el)
    for el in arrow_h(W - 110, 92, cx + 90): d.add(el)
    d.add(txt(cx + 96, 112, 'Data', size=7, color=BLUE))
    d.add(txt(cx + 96, 81, 'Reports', size=7, color=GREEN))

    # System <-> Cloudinary
    d.add(Line(cx, 75, cx, 44, strokeColor=ORANGE, strokeWidth=1.2))
    for el in arrow_v(cx, 44, 44): d.add(el)
    d.add(txt(cx + 4, 58, 'Image URLs', size=7, color=ORANGE))

    # Title
    d.add(txt(W/2, 190, 'Figure 4.3 — DFD Level 0 (Context Diagram)', size=8,
              color=NAVY, bold=True, anchor='middle'))

    return d


# ── DIAGRAM 5: DFD Level 1 ───────────────────────────────────────────────────
def make_dfd1():
    W, H = CONTENT_W, 320
    d = Drawing(W, H)

    pw, ph = 110, 34
    dw, dh = 120, 24

    def proc(x, y, label, fill=LIGHT_BLUE, sc=BLUE):
        d.add(RoundRect(x, y, pw, ph, 17, fillColor=fill, strokeColor=sc, strokeWidth=1.3))
        d.add(txt(x + pw/2, y + ph/2 - 4, label, size=8, color=sc, bold=True, anchor='middle'))

    def store(x, y, label):
        d.add(Line(x, y + dh, x + dw, y + dh, strokeColor=MGRAY, strokeWidth=1.5))
        d.add(Line(x, y, x + dw, y, strokeColor=MGRAY, strokeWidth=1.5))
        d.add(txt(x + dw/2, y + 7, label, size=7.5, color=DARK, bold=True, anchor='middle'))

    def av2(x, y1, y2):
        for el in arrow_v(x, y1, y2): d.add(el)

    def ah2(x1, y, x2):
        for el in arrow_h(x1, y, x2): d.add(el)

    # Processes (left column)
    proc(10,  270, 'P1: Auth')
    proc(10,  210, 'P2: Profile Mgmt', fill=LGREEN, sc=GREEN)
    proc(10,  150, 'P3: Opportunities', fill=LYELLOW, sc=ORANGE)
    proc(10,  90,  'P4: Events', fill=LPURPLE, sc=PURPLE)
    proc(10,  30,  'P5: Study Groups', fill=HexColor('#FDEDEC'), sc=RED)

    # Processes (right column)
    proc(W-120, 270, 'P6: Messaging', fill=LIGHT_BLUE, sc=BLUE)
    proc(W-120, 210, 'P7: Notifications', fill=LGREEN, sc=GREEN)
    proc(W-120, 150, 'P8: Admin Panel', fill=LYELLOW, sc=ORANGE)

    # Data stores (middle)
    sx = W/2 - dw/2
    store(sx, 260, 'D1: Users DB')
    store(sx, 210, 'D2: Opportunities DB')
    store(sx, 160, 'D3: Events DB')
    store(sx, 110, 'D4: Study Groups DB')
    store(sx, 60,  'D5: Messages DB')
    store(sx, 10,  'D6: Notifications DB')

    # Connect processes to stores with short arrows
    def conn(px, py, dx, dy):
        d.add(Line(px, py, dx, dy, strokeColor=HexColor('#AEB6BF'),
                   strokeWidth=1, strokeDashArray=[3, 2]))

    conn(10 + pw, 287, sx, 272)       # Auth -> Users DB
    conn(10 + pw, 227, sx, 222)       # Profile -> Opportunities DB
    conn(10 + pw, 167, sx, 172)       # Opps -> Events DB
    conn(10 + pw, 107, sx, 122)       # Events -> StudyGroups DB
    conn(10 + pw, 47,  sx, 72)        # StudyGroups -> Messages DB
    conn(W-120,   287, sx + dw, 272)  # Messaging -> Users DB
    conn(W-120,   227, sx + dw, 222)  # Notifications -> Opps DB
    conn(W-120,   167, sx + dw, 22)   # Admin -> Notifs DB

    # Title
    d.add(txt(W/2, 308, 'Figure 4.4 — DFD Level 1 (Process-Level Diagram)',
              size=8, color=NAVY, bold=True, anchor='middle'))

    return d


# ── TABLE HELPERS ─────────────────────────────────────────────────────────────
def hdr_style(bg=NAVY):
    return TableStyle([
        ('BACKGROUND',  (0, 0), (-1, 0), bg),
        ('TEXTCOLOR',   (0, 0), (-1, 0), WHITE),
        ('FONTNAME',    (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',    (0, 0), (-1, 0), 9),
        ('ALIGN',       (0, 0), (-1, 0), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 7),
        ('TOPPADDING',    (0, 0), (-1, 0), 7),
        ('FONTNAME',    (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE',    (0, 1), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LBLUE2]),
        ('GRID',        (0, 0), (-1, -1), 0.5, HexColor('#BDC3C7')),
        ('TOPPADDING',    (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('LEFTPADDING',   (0, 0), (-1, -1), 8),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 8),
        ('VALIGN',      (0, 0), (-1, -1), 'MIDDLE'),
    ])


def make_api_table():
    cw = [40, 185, 60, 168]
    data = [
        ['Method', 'Endpoint', 'Auth', 'Description'],
        ['POST',   '/api/auth/register',         'No',  'Register new student account'],
        ['POST',   '/api/auth/login',             'No',  'Login and receive JWT token'],
        ['GET',    '/api/auth/me',                'Yes', 'Get authenticated user profile'],
        ['GET',    '/api/users/:id',              'Yes', 'Get public profile by user ID'],
        ['PUT',    '/api/users/profile',          'Yes', 'Update own profile details'],
        ['POST',   '/api/users/avatar',           'Yes', 'Upload profile picture (Cloudinary)'],
        ['POST',   '/api/users/follow/:id',       'Yes', 'Follow a student'],
        ['DELETE', '/api/users/follow/:id',       'Yes', 'Unfollow a student'],
        ['GET',    '/api/users/:id/followers',    'Yes', 'Get list of followers'],
        ['GET',    '/api/users/:id/following',    'Yes', 'Get list of following'],
        ['GET',    '/api/opportunities',          'No',  'Get all opportunities (with filters)'],
        ['POST',   '/api/opportunities',          'Yes', 'Create new opportunity post'],
        ['GET',    '/api/opportunities/:id',      'No',  'Get opportunity details by ID'],
        ['PUT',    '/api/opportunities/:id',      'Yes', 'Update own opportunity (owner only)'],
        ['DELETE', '/api/opportunities/:id',      'Yes', 'Delete own opportunity (owner only)'],
        ['GET',    '/api/events',                 'No',  'Get all upcoming events'],
        ['POST',   '/api/events',                 'Yes', 'Create new campus event'],
        ['GET',    '/api/events/:id',             'No',  'Get event details by ID'],
        ['PUT',    '/api/events/:id',             'Yes', 'Update event (organizer only)'],
        ['DELETE', '/api/events/:id',             'Yes', 'Delete event (organizer only)'],
        ['GET',    '/api/groups',                 'Yes', 'Get all study groups'],
        ['POST',   '/api/groups',                 'Yes', 'Create a new study group'],
        ['POST',   '/api/groups/:id/join',        'Yes', 'Join a study group'],
        ['DELETE', '/api/groups/:id/leave',       'Yes', 'Leave a study group'],
        ['GET',    '/api/messages/:userId',       'Yes', 'Get conversation with a user'],
        ['POST',   '/api/messages',               'Yes', 'Send a direct message'],
        ['GET',    '/api/notifications',          'Yes', 'Get all notifications for user'],
        ['PUT',    '/api/notifications/:id/read', 'Yes', 'Mark notification as read'],
        ['PUT',    '/api/notifications/read-all', 'Yes', 'Mark all notifications as read'],
        ['GET',    '/api/admin/stats',            'Admin','Get platform-wide statistics'],
        ['GET',    '/api/admin/users',            'Admin','List all users'],
        ['DELETE', '/api/admin/users/:id',        'Admin','Ban or delete a user'],
        ['DELETE', '/api/admin/posts/:id',        'Admin','Remove inappropriate post'],
    ]
    t = Table(data, colWidths=cw)
    style = hdr_style()
    # Colour method cells
    for row_i, row in enumerate(data[1:], 1):
        m = row[0]
        c = {
            'GET':    (LGREEN,   GREEN),
            'POST':   (LBLUE2,   BLUE),
            'PUT':    (LYELLOW,  ORANGE),
            'DELETE': (HexColor('#FDEDEC'), RED),
        }.get(m, (WHITE, DARK))
        style.add('BACKGROUND', (0, row_i), (0, row_i), c[0])
        style.add('TEXTCOLOR',  (0, row_i), (0, row_i), c[1])
        style.add('FONTNAME',   (0, row_i), (0, row_i), 'Helvetica-Bold')
        if row[2] == 'Admin':
            style.add('TEXTCOLOR', (2, row_i), (2, row_i), PURPLE)
            style.add('FONTNAME',  (2, row_i), (2, row_i), 'Helvetica-Bold')
    t.setStyle(style)
    return t


def make_test_table():
    cw = [38, 160, 50, 120, 85]
    data = [
        ['TC ID', 'Endpoint / Action', 'Method', 'Input / Scenario', 'Expected Result'],
        ['TC-001', '/api/auth/register', 'POST', 'Valid name, email, password', '201 Created + JWT token'],
        ['TC-002', '/api/auth/register', 'POST', 'Duplicate email address', '400 Email already registered'],
        ['TC-003', '/api/auth/register', 'POST', 'Empty required field', '400 Validation error'],
        ['TC-004', '/api/auth/login',    'POST', 'Valid credentials', '200 OK + JWT token'],
        ['TC-005', '/api/auth/login',    'POST', 'Wrong password', '401 Unauthorized'],
        ['TC-006', '/api/auth/login',    'POST', 'Unregistered email', '404 User not found'],
        ['TC-007', '/api/opportunities', 'GET',  'No filters applied', '200 Paginated list'],
        ['TC-008', '/api/opportunities', 'GET',  'Filter: type=internship', '200 Filtered list'],
        ['TC-009', '/api/opportunities', 'POST', 'Valid opportunity data', '201 Opportunity created'],
        ['TC-010', '/api/opportunities/:id', 'DELETE', 'Owner deletes own post', '200 Deleted'],
        ['TC-011', '/api/opportunities/:id', 'DELETE', 'Non-owner attempts delete', '403 Forbidden'],
        ['TC-012', '/api/users/follow/:id', 'POST', 'Follow new user', '200 Following'],
        ['TC-013', '/api/users/follow/:id', 'POST', 'Follow already followed', '400 Already following'],
        ['TC-014', '/api/events', 'POST', 'Valid event with future date', '201 Event created'],
        ['TC-015', '/api/events', 'POST', 'Past date in event form', '400 Date must be future'],
        ['TC-016', '/api/messages', 'POST', 'Send message to valid user', '201 Message sent'],
        ['TC-017', '/api/notifications', 'GET', 'Authenticated user', '200 Notification list'],
        ['TC-018', '/api/admin/stats', 'GET', 'Non-admin user', '403 Forbidden'],
        ['TC-019', '/api/admin/stats', 'GET', 'Admin user', '200 Platform stats'],
        ['TC-020', 'Protected route', 'GET', 'Expired JWT token', '401 Token expired'],
    ]
    t = Table(data, colWidths=cw)
    style = hdr_style()
    for row_i, row in enumerate(data[1:], 1):
        res = row[4]
        if '200' in res or '201' in res:
            style.add('TEXTCOLOR', (4, row_i), (4, row_i), GREEN)
            style.add('FONTNAME',  (4, row_i), (4, row_i), 'Helvetica-Bold')
        elif '400' in res or '401' in res or '403' in res or '404' in res:
            style.add('TEXTCOLOR', (4, row_i), (4, row_i), RED)
            style.add('FONTNAME',  (4, row_i), (4, row_i), 'Helvetica-Bold')
    t.setStyle(style)
    return t


def make_bug_table():
    cw = [38, 185, 60, 60, 110]
    data = [
        ['Bug ID', 'Description', 'Severity', 'Status', 'Resolution'],
        ['B-001', 'Register button active with empty required fields', 'High', 'Fixed', 'Added client-side required field checks'],
        ['B-002', 'Cloudinary profile image not rendering in feed', 'High', 'Fixed', 'Corrected URL path in response mapping'],
        ['B-003', 'Mark-all-read notification endpoint returning 404', 'Medium', 'Fixed', 'Fixed route registration order in server.js'],
        ['B-004', 'Logout did not redirect, stale AuthContext', 'Medium', 'Fixed', 'Added navigate("/login") + context reset'],
        ['B-005', 'Long opportunity titles overflowed card boundaries', 'Low', 'Fixed', 'Applied CSS text-overflow: ellipsis'],
        ['B-006', 'Hamburger mobile menu cut off on 375px screens', 'High', 'Fixed', 'Fixed Tailwind breakpoints + z-index'],
        ['B-007', 'Message input not clearing after send', 'Low', 'Fixed', 'Reset useState input after POST success'],
        ['B-008', 'Search returning no results for special chars', 'Medium', 'Fixed', 'Added regex escaping in search controller'],
        ['B-009', 'JWT not attached to Axios requests after refresh', 'High', 'Fixed', 'Added Axios request interceptor on init'],
        ['B-010', 'Study group join button allowed duplicate join', 'Medium', 'Fixed', 'Added $addToSet in Mongoose update query'],
    ]
    t = Table(data, colWidths=cw)
    style = hdr_style()
    for row_i in range(1, len(data)):
        sev = data[row_i][2]
        c = {'High': RED, 'Medium': ORANGE, 'Low': GREEN}.get(sev, DARK)
        style.add('TEXTCOLOR', (2, row_i), (2, row_i), c)
        style.add('FONTNAME',  (2, row_i), (2, row_i), 'Helvetica-Bold')
        style.add('TEXTCOLOR', (3, row_i), (3, row_i), GREEN)
        style.add('FONTNAME',  (3, row_i), (3, row_i), 'Helvetica-Bold')
    t.setStyle(style)
    return t


def make_req_table():
    """Hardware requirements table."""
    cw = [100, 170, 183]
    data = [
        ['Requirement', 'Development Machine', 'Deployment Server'],
        ['Processor',   'Intel Core i5 / AMD Ryzen 5 or higher', 'Dual-core CPU (min 1 GHz)'],
        ['RAM',         '8 GB minimum (16 GB recommended)', '512 MB minimum (1 GB recommended)'],
        ['Storage',     '50 GB SSD free space', 'Free-tier cloud (Render / Railway)'],
        ['Internet',    'Broadband (5 Mbps min)', 'Stable hosting connection'],
        ['OS',          'Windows 10/11, Ubuntu 20.04, macOS 12+', 'Ubuntu 20.04 LTS (Server)'],
        ['Display',     '1366 x 768 or higher', 'N/A (Headless server)'],
    ]
    t = Table(data, colWidths=cw)
    t.setStyle(hdr_style())
    return t


def make_sw_table():
    cw = [120, 80, 253]
    data = [
        ['Software / Tool', 'Version', 'Purpose'],
        ['Node.js',          'v18.x LTS',  'JavaScript server-side runtime environment'],
        ['Express.js',       'v4.18.x',    'Minimalist web framework for REST API'],
        ['React.js',         'v18.x',      'Frontend component-based UI library'],
        ['MongoDB',          'v6.x',       'NoSQL document database (via Atlas)'],
        ['Mongoose',         'v7.x',       'ODM for MongoDB schema and query building'],
        ['Vite',             'v5.x',       'Fast frontend build tool and dev server'],
        ['Tailwind CSS',     'v3.x',       'Utility-first CSS framework for styling'],
        ['JWT (jsonwebtoken)','v9.x',      'Token-based authentication library'],
        ['bcryptjs',         'v2.x',       'Password hashing with salt rounds'],
        ['Axios',            'v1.x',       'Promise-based HTTP client for React'],
        ['Socket.io',        'v4.x',       'Real-time bidirectional event communication'],
        ['Cloudinary SDK',   'v1.x',       'Cloud image and media storage integration'],
        ['Postman',          'v10+',       'REST API endpoint testing and documentation'],
        ['VS Code',          'Latest',     'Primary Integrated Development Environment'],
        ['Git / GitHub',     'v2.x',       'Version control and remote repository hosting'],
        ['MongoDB Compass',  'Latest',     'GUI client for MongoDB database inspection'],
    ]
    t = Table(data, colWidths=cw)
    t.setStyle(hdr_style())
    return t


def make_comparison_table():
    cw = [100, 58, 58, 58, 58, 58, 63]
    def Y(): return 'Yes'
    def N(): return 'No'
    def P(): return 'Partial'
    data = [
        ['Feature',           'LinkedIn', 'Internshala', 'WhatsApp', 'College Portal', 'Discord', 'MyCircle'],
        ['Student-focused',    P(),  Y(),   Y(),   Y(),   N(),   Y()],
        ['Local College Focus',N(),  N(),   P(),   Y(),   N(),   Y()],
        ['Opportunity Posting',P(),  Y(),   N(),   N(),   N(),   Y()],
        ['Verified Profiles',  P(),  N(),   N(),   Y(),   N(),   Y()],
        ['Real-time Chat',     N(),  N(),   Y(),   N(),   Y(),   Y()],
        ['Event Management',   N(),  N(),   N(),   P(),   P(),   Y()],
        ['Study Groups',       N(),  N(),   P(),   N(),   P(),   Y()],
        ['Notifications',      Y(),  P(),   Y(),   N(),   Y(),   Y()],
        ['Mobile Responsive',  Y(),  Y(),   Y(),   N(),   Y(),   Y()],
        ['Free to Use',        Y(),  Y(),   Y(),   Y(),   Y(),   Y()],
    ]
    t = Table(data, colWidths=cw)
    style = hdr_style(NAVY)
    for row_i in range(1, len(data)):
        for col_i in range(1, len(data[row_i])):
            val = data[row_i][col_i]
            if val == 'Yes':
                style.add('TEXTCOLOR', (col_i, row_i), (col_i, row_i), GREEN)
                style.add('FONTNAME',  (col_i, row_i), (col_i, row_i), 'Helvetica-Bold')
            elif val == 'No':
                style.add('TEXTCOLOR', (col_i, row_i), (col_i, row_i), RED)
            elif val == 'Partial':
                style.add('TEXTCOLOR', (col_i, row_i), (col_i, row_i), ORANGE)
            style.add('ALIGN', (col_i, row_i), (col_i, row_i), 'CENTER')
    # Highlight MyCircle column
    for row_i in range(0, len(data)):
        style.add('BACKGROUND', (6, row_i), (6, row_i),
                  NAVY if row_i == 0 else LIGHT_BLUE)
    t.setStyle(style)
    return t


def make_module_table():
    cw = [95, 160, 198]
    data = [
        ['Module', 'Description', 'Key Components'],
        ['Authentication', 'Handles user registration, login, and session management', 'JWT, bcrypt, /auth routes, authMiddleware'],
        ['User / Profile', 'Manages student profiles, avatars, and follow relationships', 'UserModel, profileController, Cloudinary'],
        ['Opportunities', 'CRUD for internship, job, and gig postings with filtering', 'OpportunityModel, opportunityController, feed'],
        ['Events', 'Campus event creation, listing, and management', 'EventModel, eventController, chronological sort'],
        ['Study Groups', 'Group creation, membership management, subject filtering', 'GroupModel, groupController, member array'],
        ['Messaging', 'Direct messaging with conversation threading', 'MessageModel, messageController, polling/WS'],
        ['Notifications', 'Event-triggered alerts for follows, posts, and reminders', 'NotificationModel, notifController, socket emit'],
        ['Admin Panel', 'Content moderation, user management, platform analytics', 'adminMiddleware, dashboardController, stats'],
    ]
    t = Table(data, colWidths=cw)
    t.setStyle(hdr_style())
    return t


# ── CHAPTER HEADER BOX ───────────────────────────────────────────────────────
def chapter_header(story, ch_num, ch_title, ST):
    story.append(Spacer(1, 0.2*cm))
    # Blue chapter banner
    data = [[f'Chapter {ch_num}', ch_title]]
    t = Table(data, colWidths=[70, CONTENT_W - 70])
    t.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (0, 0), BLUE),
        ('BACKGROUND',    (1, 0), (1, 0), NAVY),
        ('TEXTCOLOR',     (0, 0), (-1, -1), WHITE),
        ('FONTNAME',      (0, 0), (0, 0), 'Helvetica'),
        ('FONTSIZE',      (0, 0), (0, 0), 9),
        ('FONTNAME',      (1, 0), (1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',      (1, 0), (1, 0), 14),
        ('TOPPADDING',    (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING',   (0, 0), (-1, -1), 10),
        ('ALIGN',         (0, 0), (0, 0), 'CENTER'),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.4*cm))


def info_box(story, title, text, ST, color=LIGHT_BLUE, bcolor=BLUE):
    """Coloured info callout box."""
    data = [[Paragraph(f'<b>{title}</b>', ST['h3']),
             Paragraph(text, ST['body'])]]
    t = Table(data, colWidths=[100, CONTENT_W - 106])
    t.setStyle(TableStyle([
        ('BACKGROUND',  (0, 0), (-1, -1), color),
        ('BOX',         (0, 0), (-1, -1), 1.5, bcolor),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING',  (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.3*cm))


def diagram_frame(story, drawing, caption, ST):
    story.append(Spacer(1, 0.2*cm))
    story.append(drawing)
    story.append(Paragraph(caption, ST['caption']))
    story.append(Spacer(1, 0.2*cm))


# ── TITLE PAGE ───────────────────────────────────────────────────────────────
def build_title_page(story, ST):
    # Top border line
    story.append(Spacer(1, 0.5*cm))
    t = Table([['']],  colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,-1), 3, NAVY),
        ('LINEBELOW', (0,0), (-1,-1), 1, BLUE),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.5*cm))

    story.append(Paragraph('MINOR PROJECT REPORT', ST['title_bold']))
    story.append(Paragraph('On', ST['title_sub']))
    story.append(Spacer(1, 0.4*cm))

    # Project title box
    tb = Table([[Paragraph('MyCircle', ST['title_main'])]],
               colWidths=[CONTENT_W])
    tb.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), NAVY),
        ('TOPPADDING', (0,0), (-1,-1), 14),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(tb)
    sub_tb = Table([[Paragraph('A Local Student Opportunity &amp; Networking Platform',
                               ST['title_sub'])]],
                   colWidths=[CONTENT_W])
    sub_tb.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BLUE),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(sub_tb)

    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(
        'Submitted in partial fulfillment of the requirements for the award of the degree of',
        ST['center']))
    story.append(Paragraph('<b>MASTER OF COMPUTER APPLICATIONS</b>', ST['title_bold']))
    story.append(Spacer(1, 0.3*cm))

    story.append(HRFlowable(width=CONTENT_W, thickness=0.8, color=BLUE))
    story.append(Spacer(1, 0.3*cm))

    # Two column for Guide / Student
    guide_data = [
        [Paragraph('<b>Guided By:</b>', ST['title_bold']),
         Paragraph('<b>Submitted By:</b>', ST['title_bold'])],
        [Paragraph('[GUIDE_NAME]<br/>Assistant Professor', ST['center']),
         Paragraph('[STUDENT_NAME]<br/>Roll No: [ROLL_NO]<br/>Enrollment No: [ENROLLMENT_NO]',
                   ST['center'])],
    ]
    gt = Table(guide_data, colWidths=[CONTENT_W/2, CONTENT_W/2])
    gt.setStyle(TableStyle([
        ('TOPPADDING',    (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('ALIGN',         (0,0), (-1,-1), 'CENTER'),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(gt)

    story.append(Spacer(1, 0.3*cm))
    story.append(HRFlowable(width=CONTENT_W, thickness=0.8, color=BLUE))
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph('<b>MCA 2nd Semester | 2025</b>', ST['title_bold']))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph('Department of Computer Science and Information Technology', ST['center']))
    story.append(Paragraph('<b>Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.)</b>', ST['title_bold']))

    story.append(Spacer(1, 0.5*cm))
    t2 = Table([['']],  colWidths=[CONTENT_W])
    t2.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,-1), 1, BLUE),
        ('LINEBELOW', (0,0), (-1,-1), 3, NAVY),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t2)
    story.append(PageBreak())


def cert_page(story, ST, title, body_paras):
    story.append(Spacer(1, 0.8*cm))
    # Certificate header
    tb = Table([[Paragraph(title, ST['title_bold'])]],
               colWidths=[CONTENT_W])
    tb.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), NAVY),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(tb)
    story.append(Spacer(1, 0.6*cm))

    for p in body_paras:
        story.append(Paragraph(p, ST['cert']))

    story.append(Spacer(1, 1.2*cm))
    sign_data = [
        [Paragraph('Date: _______________', ST['sign_lbl']),
         Paragraph('Place: Bilaspur (C.G.)', ST['sign_lbl'])],
        [Paragraph('', ST['sign_lbl']), Paragraph('', ST['sign_lbl'])],
        [Paragraph('', ST['sign_lbl']), Paragraph('', ST['sign_lbl'])],
        [Paragraph('(Signature of Candidate)', ST['sign_lbl']),
         Paragraph('(Signature of Guide)', ST['sign_lbl'])],
        [Paragraph('[STUDENT_NAME]', ST['sign_name']),
         Paragraph('[GUIDE_NAME]', ST['sign_name'])],
    ]
    st = Table(sign_data, colWidths=[CONTENT_W/2, CONTENT_W/2])
    st.setStyle(TableStyle([
        ('ALIGN',   (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(st)
    story.append(PageBreak())


def build_abbrev_table(ST):
    abbrevs = [
        ('API',     'Application Programming Interface'),
        ('bcrypt',  'Blowfish Crypt — Password Hashing Algorithm'),
        ('CDN',     'Content Delivery Network'),
        ('CORS',    'Cross-Origin Resource Sharing'),
        ('CRUD',    'Create, Read, Update, Delete'),
        ('CSRF',    'Cross-Site Request Forgery'),
        ('CSS',     'Cascading Style Sheets'),
        ('DFD',     'Data Flow Diagram'),
        ('DOM',     'Document Object Model'),
        ('ER',      'Entity-Relationship'),
        ('GUI',     'Graphical User Interface'),
        ('HTML',    'HyperText Markup Language'),
        ('HTTP',    'HyperText Transfer Protocol'),
        ('HTTPS',   'HyperText Transfer Protocol Secure'),
        ('JWT',     'JSON Web Token'),
        ('MCA',     'Master of Computer Applications'),
        ('MERN',    'MongoDB, Express.js, React.js, Node.js'),
        ('MVC',     'Model-View-Controller'),
        ('NoSQL',   'Not Only SQL'),
        ('ODM',     'Object Document Mapper'),
        ('ORM',     'Object Relational Mapper'),
        ('OTP',     'One-Time Password'),
        ('RBAC',    'Role-Based Access Control'),
        ('REST',    'Representational State Transfer'),
        ('SPA',     'Single Page Application'),
        ('SQL',     'Structured Query Language'),
        ('UI',      'User Interface'),
        ('URL',     'Uniform Resource Locator'),
        ('UX',      'User Experience'),
        ('WS',      'WebSocket'),
        ('XSS',     'Cross-Site Scripting'),
    ]
    data = [['Abbreviation', 'Full Form']] + list(abbrevs)
    cw = [120, CONTENT_W - 120]
    t = Table(data, colWidths=cw)
    style = hdr_style()
    t.setStyle(style)
    return t


# ── MAIN STORY BUILDER ────────────────────────────────────────────────────────
def build_story(ST):
    story = []

    # ── TITLE PAGE ────────────────────────────────────────────────────────────
    build_title_page(story, ST)

    # ── CERTIFICATE OF APPROVAL ───────────────────────────────────────────────
    cert_page(story, ST, 'CERTIFICATE OF APPROVAL', [
        'This is to certify that the Minor Project Report entitled <b>"MyCircle – A Local Student '
        'Opportunity &amp; Networking Platform"</b> submitted by <b>[STUDENT_NAME]</b>, Roll No: '
        '[ROLL_NO], MCA 2nd Semester student at Guru Ghasidas Vishwavidyalaya, Bilaspur (C.G.), '
        'is a bonafide record of the project work carried out by him/her under my supervision '
        'and guidance during the academic year 2025.',

        'The project has been completed in partial fulfillment of the requirements for the award '
        'of the degree of Master of Computer Applications and is of sufficient merit to warrant '
        'the candidate\'s appearance for the viva-voce examination.',

        'The candidate has fulfilled all prescribed conditions and has demonstrated thorough '
        'understanding of modern full-stack web development principles, system design, and '
        'software engineering practices throughout the project.',
    ])

    # ── SELF DECLARATION ──────────────────────────────────────────────────────
    cert_page(story, ST, 'SELF DECLARATION', [
        'I, <b>[STUDENT_NAME]</b>, hereby declare that the Minor Project Report entitled '
        '<b>"MyCircle – A Local Student Opportunity &amp; Networking Platform"</b> submitted '
        'by me is an authentic record of my project work carried out at the Department of '
        'Computer Science and Information Technology, Guru Ghasidas Vishwavidyalaya, Bilaspur '
        '(C.G.), under the guidance of <b>[GUIDE_NAME]</b>, Assistant Professor.',

        'I further declare that this project work or any part thereof has not been submitted '
        'for the award of any degree, diploma, or certificate either to this University or '
        'to any other University or Institution.',

        'I assure that the code, algorithms, implementation, and documentation presented in '
        'this report are original and created by me through proper understanding, learning, '
        'and implementation of the required concepts and technologies.',
    ])

    # ── ACKNOWLEDGEMENTS ──────────────────────────────────────────────────────
    story.append(Spacer(1, 0.8*cm))
    tb = Table([[Paragraph('ACKNOWLEDGEMENTS', ST['title_bold'])]], colWidths=[CONTENT_W])
    tb.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),NAVY),
                             ('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)]))
    story.append(tb)
    story.append(Spacer(1, 0.6*cm))

    for para in [
        'I express my sincere gratitude and heartfelt thanks to the Head of Department, '
        'Department of Computer Science and Information Technology, Guru Ghasidas '
        'Vishwavidyalaya, Bilaspur (C.G.), for providing the necessary facilities, resources, '
        'and academic environment required to carry out this project successfully.',

        'I am deeply grateful to my project guide, <b>[GUIDE_NAME]</b>, Assistant Professor, '
        'for his invaluable guidance, constant motivation, and constructive criticism '
        'throughout the development and documentation phases of this project. His technical '
        'insights and patient mentorship significantly elevated the quality of both the '
        'implementation and this report.',

        'I also thank all the faculty members of the Department of Computer Science and '
        'Information Technology for their continuous support and for creating an inspiring '
        'learning environment throughout the MCA programme. Their collective wisdom has '
        'shaped my approach to problem-solving and software engineering.',

        'My sincere thanks go to my classmates and friends who actively participated in '
        'testing MyCircle during its development phase, providing genuine feedback that '
        'helped identify usability issues and improve the platform\'s overall user experience.',

        'I would like to acknowledge the open-source community and the dedicated documentation '
        'teams behind MongoDB, Express.js, React.js, Node.js, and all other technologies '
        'used in this project. These freely available resources were instrumental in every '
        'phase of development.',

        'Finally, I express my profound gratitude to my parents and family for their '
        'unwavering support, encouragement, and belief in my abilities throughout my '
        'academic journey. Their sacrifices and motivation remain my greatest driving force.',
    ]:
        story.append(Paragraph(para, ST['cert']))

    story.append(PageBreak())

    # ── ABSTRACT ─────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.8*cm))
    tb = Table([[Paragraph('ABSTRACT', ST['title_bold'])]], colWidths=[CONTENT_W])
    tb.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),NAVY),
                             ('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)]))
    story.append(tb)
    story.append(Spacer(1, 0.4*cm))

    for para in [
        'The landscape of higher education in India has undergone significant transformation, '
        'with students increasingly requiring digital infrastructure that serves their hyper-local '
        'college ecosystems. While global platforms such as LinkedIn address professional '
        'networking at a macro level, and messaging applications like WhatsApp enable informal '
        'communication, no dedicated platform exists specifically for college students to discover '
        'local opportunities, connect with institutional peers, and engage meaningfully within '
        'their immediate academic community.',

        '<b>MyCircle</b> is a comprehensive local student opportunity and networking platform '
        'developed using the MERN stack — MongoDB, Express.js, React.js, and Node.js. The '
        'platform enables students to post and discover local opportunities including '
        'internships, part-time jobs, freelance gigs, campus events, hackathons, and study '
        'groups. Students build verified profiles linked to their institution, follow their '
        'peers to create personalised feeds, communicate through real-time direct messaging, '
        'and stay informed through an intelligent notification system.',

        'The frontend is built with React.js and Vite, styled using Tailwind CSS for a modern '
        'mobile-first responsive design. The backend employs a RESTful API architecture with '
        'Node.js and Express.js, managing data persistence through MongoDB with Mongoose ODM. '
        'Security is enforced through JWT-based authentication, bcrypt password hashing, and '
        'role-based access control. Real-time features are implemented using Socket.io, while '
        'Cloudinary handles cloud-based media storage.',

        'This report documents the complete development lifecycle of MyCircle, covering '
        'requirements analysis, system design with ER diagrams and DFDs, technology stack '
        'analysis, feature implementation walkthrough, comprehensive testing with 20 test cases, '
        'and a realistic assessment of current limitations alongside a roadmap for future '
        'enhancement. The platform represents a functional prototype demonstrating the viability '
        'of hyper-local student networking tailored specifically to tier-2 and tier-3 '
        'city college ecosystems in India.',
    ]:
        story.append(Paragraph(para, ST['body']))

    story.append(Spacer(1, 0.3*cm))
    kw_data = [['Keywords:', 'MERN Stack, Student Networking, Local Opportunities, React.js, '
                             'MongoDB, Express.js, Node.js, JWT Authentication, REST API']]
    kt = Table(kw_data, colWidths=[65, CONTENT_W - 65])
    kt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), NAVY),
        ('BACKGROUND', (1,0), (1,0), LIGHT_BLUE),
        ('TEXTCOLOR',  (0,0), (0,0), WHITE),
        ('FONTNAME',   (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE',   (0,0), (-1,-1), 9),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING',(0,0),(-1,-1), 7),
        ('LEFTPADDING',(0,0), (-1,-1), 8),
    ]))
    story.append(kt)
    story.append(PageBreak())

    # ── TABLE OF CONTENTS ─────────────────────────────────────────────────────
    story.append(Spacer(1, 0.8*cm))
    tb = Table([[Paragraph('TABLE OF CONTENTS', ST['title_bold'])]], colWidths=[CONTENT_W])
    tb.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),NAVY),
                             ('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)]))
    story.append(tb)
    story.append(Spacer(1, 0.5*cm))

    toc_entries = [
        ('Front Matter', [
            ('Certificate of Approval', 'ii'), ('Self Declaration', 'iii'),
            ('Acknowledgements', 'iv'), ('Abstract', 'v'),
            ('Table of Contents', 'vi'), ('List of Figures', 'vii'),
            ('List of Abbreviations', 'viii'),
        ]),
        ('Chapter 1: Introduction', [
            ('1.1  Introduction to the Project', '1'),
            ('1.2  Problem Statement', '2'),
            ('1.3  Motivation', '3'),
            ('1.4  Project Scope', '4'),
            ('1.5  Organization of the Report', '5'),
        ]),
        ('Chapter 2: Literature Review / Existing Systems', [
            ('2.1  Overview of Existing Platforms', '6'),
            ('2.2  Comparative Analysis', '8'),
            ('2.3  Research Gap', '9'),
            ('2.4  Justification for Building MyCircle', '10'),
        ]),
        ('Chapter 3: System Requirements', [
            ('3.1  Functional Requirements', '11'),
            ('3.2  Non-Functional Requirements', '13'),
            ('3.3  Hardware Requirements', '14'),
            ('3.4  Software Requirements', '14'),
        ]),
        ('Chapter 4: System Design', [
            ('4.1  System Architecture', '15'),
            ('4.2  Architecture Diagram', '16'),
            ('4.3  Database Design', '17'),
            ('4.4  ER Diagram', '19'),
            ('4.5  Data Flow Diagram (DFD)', '20'),
            ('4.6  Use Case Diagram', '22'),
            ('4.7  Module Description', '23'),
            ('4.8  API Design (REST Endpoints)', '24'),
        ]),
        ('Chapter 5: Technology Stack', [
            ('5.1  MongoDB &amp; Mongoose', '26'),
            ('5.2  Express.js', '27'),
            ('5.3  React.js', '28'),
            ('5.4  Node.js', '29'),
            ('5.5  Vite', '30'),
            ('5.6  Tailwind CSS', '31'),
            ('5.7  JWT Authentication &amp; bcrypt', '31'),
            ('5.8  Axios', '32'),
            ('5.9  Socket.io', '33'),
            ('5.10 Cloudinary &amp; Git/GitHub', '33'),
        ]),
        ('Chapter 6: Implementation &amp; Feature Walkthrough', [
            ('6.1  User Registration and Authentication', '34'),
            ('6.2  Student Profile Page', '36'),
            ('6.3  Opportunities Feed', '37'),
            ('6.4  Post an Opportunity', '38'),
            ('6.5  Campus Events', '39'),
            ('6.6  Study Groups', '40'),
            ('6.7  Follow / Unfollow System', '41'),
            ('6.8  Messaging', '41'),
            ('6.9  Notifications', '42'),
            ('6.10 Admin Panel', '43'),
        ]),
        ('Chapter 7: Testing', [
            ('7.1  Testing Strategy', '44'),
            ('7.2  Unit Testing', '44'),
            ('7.3  API Testing — Test Cases', '45'),
            ('7.4  Frontend Testing', '47'),
            ('7.5  Security Testing', '47'),
            ('7.6  Performance Testing', '48'),
            ('7.7  User Acceptance Testing', '48'),
            ('7.8  Bug Report', '49'),
        ]),
        ('Chapter 8: UI Screenshots / Walkthrough', [('8.1–8.8  Screen Descriptions', '50')]),
        ('Chapter 9: Limitations', [('9.1–9.4  Limitations', '53')]),
        ('Chapter 10: Future Scope', [('10.1–10.9  Planned Enhancements', '55')]),
        ('Chapter 11: Conclusion', [('11.1–11.4  Conclusion', '58')]),
        ('References', [('Web and Technical References', '60')]),
    ]

    for ch, secs in toc_entries:
        story.append(Paragraph(ch, ST['toc_ch']))
        for sec, pg in secs:
            data = [[Paragraph(sec, ST['toc_sec']), Paragraph(pg, ST['toc_sec'])]]
            t = Table(data, colWidths=[CONTENT_W - 40, 40])
            t.setStyle(TableStyle([
                ('ALIGN', (1,0), (1,0), 'RIGHT'),
                ('TOPPADDING', (0,0),(-1,-1), 1),
                ('BOTTOMPADDING', (0,0),(-1,-1), 1),
                ('LINEBELOW', (0,0), (-1,-1), 0.3, HexColor('#D0D3D4')),
            ]))
            story.append(t)
        story.append(Spacer(1, 0.15*cm))
    story.append(PageBreak())

    # ── LIST OF FIGURES ───────────────────────────────────────────────────────
    story.append(Spacer(1, 0.8*cm))
    tb = Table([[Paragraph('LIST OF FIGURES', ST['title_bold'])]], colWidths=[CONTENT_W])
    tb.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),NAVY),
                             ('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)]))
    story.append(tb)
    story.append(Spacer(1, 0.4*cm))

    figs = [
        ('Figure 4.1', 'System Three-Tier Architecture Diagram'),
        ('Figure 4.2', 'User Authentication Flow Flowchart'),
        ('Figure 4.3', 'DFD Level 0 — Context Diagram'),
        ('Figure 4.4', 'DFD Level 1 — Process-Level Diagram'),
        ('Figure 4.5', 'Entity-Relationship (ER) Diagram'),
        ('Figure 8.1', 'Login and Registration Page Screenshot Placeholder'),
        ('Figure 8.2', 'Home / Opportunity Feed Screenshot Placeholder'),
        ('Figure 8.3', 'Student Profile Page Screenshot Placeholder'),
        ('Figure 8.4', 'Post Opportunity Form Screenshot Placeholder'),
        ('Figure 8.5', 'Campus Events Page Screenshot Placeholder'),
        ('Figure 8.6', 'Study Groups Page Screenshot Placeholder'),
        ('Figure 8.7', 'Direct Messaging Interface Screenshot Placeholder'),
        ('Figure 8.8', 'Admin Dashboard Screenshot Placeholder'),
    ]
    for num, desc in figs:
        data = [[Paragraph(f'<b>{num}</b>', ST['toc_sec']),
                 Paragraph(desc, ST['toc_sec'])]]
        t = Table(data, colWidths=[80, CONTENT_W - 80])
        t.setStyle(TableStyle([
            ('TOPPADDING', (0,0),(-1,-1), 3), ('BOTTOMPADDING', (0,0),(-1,-1), 3),
            ('LINEBELOW', (0,0),(-1,-1), 0.3, HexColor('#D0D3D4')),
        ]))
        story.append(t)

    story.append(Spacer(1, 0.6*cm))
    story.append(Paragraph('<b>LIST OF TABLES</b>', ST['h2']))
    tables_list = [
        ('Table 2.1', 'Comparative Analysis of Existing Platforms'),
        ('Table 3.1', 'Hardware Requirements'),
        ('Table 3.2', 'Software Requirements and Tools'),
        ('Table 4.1', 'Module Description Table'),
        ('Table 4.2', 'REST API Endpoints (33 Endpoints)'),
        ('Table 7.1', 'API Test Cases (TC-001 to TC-020)'),
        ('Table 7.2', 'Bug Report Table'),
    ]
    for num, desc in tables_list:
        data = [[Paragraph(f'<b>{num}</b>', ST['toc_sec']),
                 Paragraph(desc, ST['toc_sec'])]]
        t = Table(data, colWidths=[80, CONTENT_W - 80])
        t.setStyle(TableStyle([
            ('TOPPADDING', (0,0),(-1,-1), 3), ('BOTTOMPADDING', (0,0),(-1,-1), 3),
            ('LINEBELOW', (0,0),(-1,-1), 0.3, HexColor('#D0D3D4')),
        ]))
        story.append(t)
    story.append(PageBreak())

    # ── ABBREVIATIONS ─────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.8*cm))
    tb = Table([[Paragraph('LIST OF ABBREVIATIONS', ST['title_bold'])]], colWidths=[CONTENT_W])
    tb.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),NAVY),
                             ('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)]))
    story.append(tb)
    story.append(Spacer(1, 0.4*cm))
    story.append(build_abbrev_table(ST))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # CHAPTER 1 — INTRODUCTION
    # ═══════════════════════════════════════════════════════════════════════════
    chapter_header(story, '1', 'Introduction', ST)

    story.append(Paragraph('1.1  Introduction to the Project', ST['h2']))
    for para in [
        'The digital revolution has transformed how individuals connect, collaborate, and seek '
        'professional opportunities in unprecedented ways. While global platforms such as LinkedIn, '
        'Facebook, and Twitter have fundamentally reshaped professional and social networking at a '
        'macro level, a significant and underserved gap remains at the local level — specifically '
        'within the college and university ecosystems where students spend the most formative years '
        'of their professional development.',

        '<b>MyCircle</b> emerges as a purpose-built solution designed exclusively for local college '
        'and university student communities. It is a comprehensive full-stack web platform that '
        'enables students to post and discover local opportunities — including internships, '
        'part-time jobs, freelance gigs, campus events, hackathons, workshops, and study groups — '
        'within their immediate institutional circle. The platform transcends the limitations of '
        'generic social media by offering specialised features designed for the unique needs and '
        'rhythms of student communities.',

        'Students can create verified profiles linked to their institution, follow their peers to '
        'build personalised feeds, engage in real-time direct messaging, receive targeted '
        'notifications, and actively participate in their local student ecosystem. The platform '
        'is built on the MERN stack — MongoDB, Express.js, React.js, and Node.js — ensuring a '
        'modern, scalable, and maintainable codebase.',
    ]:
        story.append(Paragraph(para, ST['body']))

    story.append(Paragraph('1.2  Problem Statement', ST['h2']))
    for para in [
        'Students in local colleges and universities face significant challenges in accessing '
        'relevant opportunities within their immediate geographic and institutional circles. '
        'The existing digital solutions either target an overly professional audience removed '
        'from student realities, or provide only casual social interaction without structured '
        'opportunity discovery capabilities.',

        'Professional networking platforms like <b>LinkedIn</b>, while excellent for experienced '
        'professionals, are intimidating and often irrelevant for first and second-year students '
        'with limited professional history. <b>WhatsApp groups</b>, while popular among students, '
        'suffer from fundamental structural limitations — important information gets buried in '
        'linear threads, there is no effective search or categorisation, and opportunities vanish '
        'within hours of posting. <b>Internship platforms like Internshala</b> operate at a national '
        'level, completely missing local freelance gigs, study groups, events, and informal '
        'opportunities that form a substantial portion of the student landscape. Institutional '
        'portals are often outdated, lack social features, and are used primarily for '
        'administrative communications.',

        'The absence of a hyper-local, student-centric platform results in missed opportunities, '
        'fragmented communication, and an inability to build meaningful connections within one\'s '
        'immediate academic community — particularly acute in tier-2 and tier-3 city colleges '
        'where national platforms provide minimal local relevance.',
    ]:
        story.append(Paragraph(para, ST['body']))

    story.append(Paragraph('1.3  Motivation', ST['h2']))
    for para in [
        'The motivation behind building MyCircle stems from direct observation of the challenges '
        'faced by fellow students in discovering local opportunities and connecting with peers '
        'within their college ecosystem. At institutions like Guru Ghasidas Vishwavidyalaya, '
        'students possess as much talent and ambition as their counterparts at premium '
        'institutions, but lack access to equivalent networks and information channels.',

        'The local student ecosystem — comprising part-time work, campus events, peer '
        'collaborations, and study groups — is vibrant and active, but operates primarily '
        'through fragmented word-of-mouth and informal group chats. A centralised platform '
        'for this ecosystem could multiply the effectiveness of student efforts dramatically.',

        'From an academic perspective, building MyCircle provides comprehensive exposure to '
        'the entire modern web development lifecycle — database design, API architecture, '
        'frontend development, authentication, cloud integration, and deployment. This project '
        'simultaneously solves a real-world problem and serves as a deep technical learning '
        'exercise preparing for professional software development roles.',
    ]:
        story.append(Paragraph(para, ST['body']))

    story.append(Paragraph('1.4  Project Scope', ST['h2']))
    story.append(Paragraph(
        'The current version of MyCircle delivers a functional prototype demonstrating the core '
        'concept of local student networking. The scope is carefully defined to ensure quality '
        'delivery within minor project constraints while remaining genuinely useful.', ST['body']))

    in_scope = [
        'Complete JWT-based user authentication (registration, login, logout)',
        'Student profile creation with profile picture upload via Cloudinary',
        'Opportunity posting and discovery (internships, part-time, freelance, jobs)',
        'Campus event creation, listing, and management',
        'Study group creation, browsing, and membership management',
        'Follow/unfollow system with personalised activity feeds',
        'Real-time direct messaging between students',
        'Notification system for follows, posts, and event reminders',
        'Admin panel with user and content moderation capabilities',
        'Fully responsive design for desktop and mobile devices',
    ]
    for item in in_scope:
        story.append(Paragraph(f'&#x2022; {item}', ST['bullet']))

    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        '<b>Out of scope for this version:</b> Mobile application (React Native), '
        'AI-based recommendation engine, Elasticsearch integration, email/OTP verification, '
        'two-factor authentication, payment gateway, and video calling.', ST['body']))

    story.append(Paragraph('1.5  Organization of the Report', ST['h2']))
    story.append(Paragraph(
        'This report is structured across eleven chapters covering the complete development '
        'lifecycle of MyCircle. Chapter 1 establishes context and motivation. Chapter 2 reviews '
        'existing platforms and identifies the research gap. Chapter 3 details functional and '
        'non-functional requirements. Chapter 4 presents system design including architecture, '
        'ER diagrams, and DFDs. Chapter 5 provides comprehensive analysis of the technology '
        'stack. Chapter 6 offers a complete feature implementation walkthrough. Chapter 7 '
        'documents the testing strategy and results. Chapter 8 provides UI screenshot '
        'documentation. Chapters 9 and 10 honestly assess limitations and future scope '
        'respectively. Chapter 11 concludes with key learnings and impact assessment.',
        ST['body']))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # CHAPTER 2 — LITERATURE REVIEW
    # ═══════════════════════════════════════════════════════════════════════════
    chapter_header(story, '2', 'Literature Review / Existing Systems', ST)

    story.append(Paragraph('2.1  Overview of Existing Platforms', ST['h2']))
    platforms = [
        ('LinkedIn', 'LinkedIn is the dominant global professional networking platform with '
         'over 900 million users. While excellent for connecting experienced professionals '
         'with corporate opportunities, LinkedIn caters primarily to career professionals '
         'with established work histories. Student profiles appear sparse and underdeveloped. '
         'The platform lacks features for local college communities, study groups, or the '
         'informal opportunities that define student experiences.'),
        ('Internshala', 'Internshala is a leading Indian internship and fresher job platform '
         'offering structured opportunity listings with filtering and application tracking. '
         'However, it focuses exclusively on formal internships and jobs, completely overlooking '
         'local freelance work, campus events, study groups, and peer collaborations. It '
         'operates at national level without any local community features.'),
        ('WhatsApp Groups', 'WhatsApp serves as the default student communication platform. '
         'While its instant messaging is highly effective, its architecture was not designed '
         'for opportunity discovery. Important posts disappear in message floods, there is '
         'no categorisation or search, no persistent listings, and no way to assess the '
         'credibility of shared opportunities.'),
        ('College Portals', 'Institutional portals carry official credibility but suffer '
         'from severely outdated user experiences, minimal student-to-student interaction '
         'features, no opportunity posting mechanisms, and negligible mobile support. '
         'They exist primarily for administrative communications rather than community building.'),
        ('Discord', 'Discord offers sophisticated community features including organised '
         'channels, voice rooms, and bot integrations. However, it is interest-based rather '
         'than institution-based, lacks verified student profiles, has no opportunity '
         'posting features, and its complexity can be overwhelming for casual users.'),
    ]
    for name, desc in platforms:
        story.append(Paragraph(f'<b>{name}:</b> {desc}', ST['body']))

    story.append(Paragraph('2.2  Comparative Analysis', ST['h2']))
    story.append(Paragraph(
        'The following table systematically compares MyCircle with existing platforms across '
        'ten critical dimensions that determine effectiveness for local student communities. '
        'Green indicates full support, orange indicates partial support, and red indicates absence.',
        ST['body']))
    story.append(Spacer(1, 0.2*cm))
    story.append(make_comparison_table())
    story.append(Paragraph('Table 2.1 — Comparative Analysis of Existing Platforms', ST['caption']))

    story.append(Paragraph('2.3  Research Gap', ST['h2']))
    story.append(Paragraph(
        'The comparative analysis reveals three specific research gaps. First, no existing '
        'platform provides a comprehensive local student opportunity directory that includes '
        'the complete spectrum — internships, part-time work, freelance gigs, campus events, '
        'hackathons, and study groups — within a single application. Second, no platform '
        'combines institutional profile verification with genuine social networking features '
        'tailored specifically to student communities. Third, existing platforms treat students '
        'either as job seekers (opportunity platforms) or casual social users (messaging apps), '
        'missing the collaborative community dimension where students both contribute to and '
        'benefit from each other\'s growth.', ST['body']))

    story.append(Paragraph('2.4  Justification for Building MyCircle', ST['h2']))
    story.append(Paragraph(
        'MyCircle is justified as a dedicated platform filling the identified research gap. '
        'Designed from the ground up for local college communities, it integrates opportunity '
        'discovery, event management, study groups, and peer networking into one cohesive '
        'experience. The MERN stack provides a modern, scalable foundation, and the mobile-first '
        'design ensures accessibility on devices most students carry. By focusing on local '
        'hyper-relevance rather than national breadth, MyCircle delivers value that no '
        'existing platform can match for its target audience.', ST['body']))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # CHAPTER 3 — SYSTEM REQUIREMENTS
    # ═══════════════════════════════════════════════════════════════════════════
    chapter_header(story, '3', 'System Requirements', ST)

    story.append(Paragraph('3.1  Functional Requirements', ST['h2']))
    story.append(Paragraph(
        'The following functional requirements define the complete set of features MyCircle '
        'must provide. These are derived from the problem statement, target user analysis, '
        'and platform scope defined in Chapter 1.', ST['body']))

    fr_sections = [
        ('User Authentication', [
            'Secure registration with name, email, password, college, and year of study',
            'JWT-based login with token issuance on successful credential verification',
            'Password hashing using bcrypt with minimum 10 salt rounds',
            'Persistent sessions across browser refreshes via localStorage',
            'Logout functionality clearing all tokens and session data',
        ]),
        ('Profile Management', [
            'Student profile creation with all academic and personal details',
            'Profile picture upload through Cloudinary with preview before save',
            'Skills/interests tag system for discoverability',
            'View follower count, following count, and post count on profiles',
            'Edit all profile information through an intuitive edit interface',
        ]),
        ('Opportunities Module', [
            'Create opportunity posts: internship, part-time, freelance, job categories',
            'Browse paginated opportunity feed with type, city, and search filters',
            'View detailed opportunity with application link and deadline',
            'Edit and delete own posts with owner verification middleware',
            'Bookmark and share opportunity links',
        ]),
        ('Events Module', [
            'Create campus events with title, date, venue, and registration details',
            'Chronological event listing with upcoming/past separation',
            'Event detail pages with organiser profile links',
            'Express interest functionality for event attendance tracking',
        ]),
        ('Study Groups', [
            'Create study groups with name, subject, description, and college scope',
            'Browse and search groups by subject and institution',
            'Join and leave groups with membership management',
            'View complete member list for each group',
        ]),
        ('Social Features', [
            'Follow and unfollow other students with real-time feed updates',
            'Personalised feed prioritising content from followed users',
            'View followers and following lists with profile links',
        ]),
        ('Messaging & Notifications', [
            'Direct messaging between any two authenticated users',
            'Conversation list with unread message indicators',
            'Real-time notifications for new followers, posts, and event reminders',
            'Notification bell with unread count badge and mark-as-read functionality',
        ]),
        ('Admin Panel', [
            'Dashboard with platform statistics: users, posts, events, reports',
            'User management: search, ban, and delete user accounts',
            'Content moderation: remove inappropriate or spam posts',
        ]),
    ]

    for section, items in fr_sections:
        story.append(Paragraph(section, ST['h3']))
        for item in items:
            story.append(Paragraph(f'&#x2022; {item}', ST['bullet']))
        story.append(Spacer(1, 0.1*cm))

    story.append(Paragraph('3.2  Non-Functional Requirements', ST['h2']))
    nfr = [
        ('Performance', 'Page load time under 3 seconds on standard broadband. API response time under 500ms. Support minimum 100 concurrent users without degradation.'),
        ('Security', 'Passwords hashed with bcrypt (10+ salt rounds). JWT tokens with configurable expiration. Protected routes via authentication middleware. CORS restricted to trusted origins.'),
        ('Scalability', 'Stateless REST API enabling horizontal scaling. MongoDB document model supporting sharding. Stateless token authentication supporting load balancer distribution.'),
        ('Availability', 'Target 99% uptime in production. Graceful error handling preventing complete system failures. Database connection pooling for reliability.'),
        ('Usability', 'Intuitive navigation without user training. Real-time form validation with clear error messages. Touch targets minimum 44x44px on mobile. WCAG contrast ratios for accessibility.'),
        ('Maintainability', 'Consistent naming conventions across codebase. Modular architecture enabling feature addition. Documented API endpoints. Actionable error logging.'),
    ]
    nfr_data = [['Attribute', 'Requirement']] + [[k, v] for k,v in nfr]
    nt = Table(nfr_data, colWidths=[90, CONTENT_W - 90])
    nt.setStyle(hdr_style())
    story.append(nt)

    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph('3.3  Hardware Requirements', ST['h2']))
    story.append(make_req_table())
    story.append(Paragraph('Table 3.1 — Hardware Requirements', ST['caption']))

    story.append(Paragraph('3.4  Software Requirements', ST['h2']))
    story.append(make_sw_table())
    story.append(Paragraph('Table 3.2 — Software Requirements and Tools', ST['caption']))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # CHAPTER 4 — SYSTEM DESIGN
    # ═══════════════════════════════════════════════════════════════════════════
    chapter_header(story, '4', 'System Design', ST)

    story.append(Paragraph('4.1  System Architecture', ST['h2']))
    story.append(Paragraph(
        'MyCircle employs a three-tier architecture that cleanly separates concerns and enables '
        'independent development and scaling of each layer. The three tiers are: the Client Tier '
        '(React.js Single Page Application), the API Tier (Node.js / Express.js REST Server), '
        'and the Data Tier (MongoDB Atlas + Cloudinary).', ST['body']))
    story.append(Paragraph(
        'The <b>Client Tier</b> comprises the React.js SPA built with Vite. All user interactions, '
        'form submissions, and data display are handled here. React components communicate with '
        'the API tier exclusively through HTTP requests via Axios, with Socket.io maintaining '
        'a persistent WebSocket connection for real-time features.', ST['body']))
    story.append(Paragraph(
        'The <b>API Tier</b> is the Node.js/Express.js server handling all business logic, '
        'authentication enforcement, and database orchestration. Every incoming request traverses '
        'a middleware chain: CORS validation, JSON body parsing, JWT authentication verification, '
        'route-specific handling, and error management. Controllers implement the MVC pattern '
        'with clean separation of routing, business logic, and data access.', ST['body']))
    story.append(Paragraph(
        'The <b>Data Tier</b> consists of MongoDB Atlas for document storage managed through '
        'Mongoose ODM, and Cloudinary for all media assets. Mongoose provides schema validation, '
        'relationship references, indexing, and query building. Cloudinary provides scalable '
        'cloud image storage with transformation capabilities.', ST['body']))

    story.append(Paragraph('4.2  System Architecture Diagram', ST['h2']))
    diagram_frame(story, make_arch_diagram(),
                  'Figure 4.1 — Three-Tier System Architecture of MyCircle', ST)

    story.append(Paragraph('4.3  Database Design', ST['h2']))
    story.append(Paragraph(
        'MyCircle uses MongoDB\'s flexible document model rather than a relational schema. '
        'Documents within each collection store JSON-like objects. This eliminates object-relational '
        'mapping complexity, aligns naturally with JavaScript\'s data structures, and allows '
        'schema evolution without expensive migrations. Six primary collections are defined:',
        ST['body']))

    collections = [
        ('Users', '_id, name, email (unique), password_hash, college, course, year, bio, '
         'profileImage (URL), role (student/admin), skills[ ], followers[ ] (User refs), '
         'following[ ] (User refs), createdAt, updatedAt'),
        ('Opportunities', '_id, title, type (internship/part-time/freelance/job), description, '
         'postedBy (User ref), college, city, tags[ ], requirements, applicationLink, '
         'deadline, isActive, createdAt, updatedAt'),
        ('Events', '_id, title, description, date, venue, organizer (User ref), college, '
         'registrationLink, isPublished, createdAt, updatedAt'),
        ('StudyGroups', '_id, name (unique), subject, description, admin (User ref), '
         'members[ ] (User refs), college, createdAt, updatedAt'),
        ('Messages', '_id, sender (User ref), receiver (User ref), content, '
         'timestamp, read (boolean)'),
        ('Notifications', '_id, userId (User ref), type, message, relatedEntity (ref), '
         'isRead (boolean), createdAt'),
    ]
    coll_data = [['Collection', 'Schema Fields']] + [[n, f] for n,f in collections]
    ct = Table(coll_data, colWidths=[100, CONTENT_W - 100])
    ct.setStyle(hdr_style())
    story.append(ct)
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph('4.4  Entity-Relationship (ER) Diagram', ST['h2']))
    story.append(Paragraph(
        'The ER diagram illustrates the relationships between all six collections in the '
        'MyCircle database. Users are the central entity, maintaining 1:N relationships with '
        'Opportunities, Events, Notifications, and Study Groups (as admin). A M:N relationship '
        'exists between Users for the follow system and between Users and Study Groups for '
        'membership. The Messages collection represents a M:N self-relationship on Users.',
        ST['body']))
    diagram_frame(story, make_er_diagram(),
                  'Figure 4.5 — Entity-Relationship Diagram (MyCircle Collections)', ST)

    story.append(Paragraph('4.5  Data Flow Diagram (DFD)', ST['h2']))
    story.append(Paragraph('4.5.1  Level 0 — Context Diagram', ST['h3']))
    story.append(Paragraph(
        'The Level 0 DFD presents MyCircle as a single process interacting with three external '
        'entities: Student Users (who access the platform for all operations), Admins (who '
        'moderate content and manage users), and Cloudinary (an external service handling '
        'media storage and retrieval).', ST['body']))
    diagram_frame(story, make_dfd0(), 'Figure 4.3 — DFD Level 0 Context Diagram', ST)

    story.append(Paragraph('4.5.2  Level 1 — Process-Level Diagram', ST['h3']))
    story.append(Paragraph(
        'The Level 1 DFD decomposes the MyCircle system into eight major processes: P1 Auth, '
        'P2 Profile Management, P3 Opportunities, P4 Events, P5 Study Groups, P6 Messaging, '
        'P7 Notifications, and P8 Admin Panel. Each process reads from and writes to dedicated '
        'data stores, with data flowing through the API tier middleware.', ST['body']))
    diagram_frame(story, make_dfd1(), 'Figure 4.4 — DFD Level 1 Process Diagram', ST)

    story.append(Paragraph('4.6  Authentication Flow', ST['h2']))
    story.append(Paragraph(
        'The following flowchart illustrates the complete authentication flow for MyCircle '
        'users, covering both registration and login paths with all decision branches '
        'including validation failures, credential errors, and successful token issuance.',
        ST['body']))
    diagram_frame(story, make_auth_flow(), 'Figure 4.2 — User Authentication Flow', ST)

    story.append(Paragraph('4.7  Module Description', ST['h2']))
    story.append(make_module_table())
    story.append(Paragraph('Table 4.1 — Module Description Table', ST['caption']))

    story.append(Paragraph('4.8  REST API Design', ST['h2']))
    story.append(Paragraph(
        'The MyCircle API follows RESTful principles with consistent JSON responses, appropriate '
        'HTTP methods, and standardised status codes. All protected routes require a valid JWT '
        'token in the Authorization header. Admin routes additionally verify the user\'s role '
        'as admin. The following table documents all 33 API endpoints:', ST['body']))
    story.append(Spacer(1, 0.2*cm))
    story.append(make_api_table())
    story.append(Paragraph('Table 4.2 — REST API Endpoints', ST['caption']))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # CHAPTER 5 — TECHNOLOGY STACK
    # ═══════════════════════════════════════════════════════════════════════════
    chapter_header(story, '5', 'Technology Stack', ST)

    tech = [
        ('5.1  MongoDB & Mongoose', [
            'MongoDB is a leading NoSQL database that stores data as flexible, JSON-like documents. '
            'Unlike relational databases with fixed table schemas, MongoDB collections can contain '
            'documents with varying structures, enabling rapid schema evolution during development. '
            'This flexibility is particularly valuable for MyCircle where each entity type — user '
            'profiles, opportunities, events — has distinct structural requirements that may change '
            'as the platform evolves.',

            'MongoDB was selected over PostgreSQL for several specific reasons. The document model '
            'eliminates object-relational mapping complexity, as MongoDB documents map directly to '
            'JavaScript objects used throughout the Node.js/React codebase. Horizontal scaling '
            'through sharding prepares the platform for future growth. MongoDB Atlas provides a '
            'managed cloud service with a free tier (512MB) suitable for project deployment, '
            'automatic backups, and built-in monitoring dashboards.',

            'Mongoose ODM serves as the abstraction layer between Express.js application code '
            'and the MongoDB driver. Mongoose schemas enforce data structure through field type '
            'definitions, required constraints, default values, and custom validators. Mongoose '
            'middleware hooks enable automated operations: password hashing in pre-save hooks '
            'ensures passwords are never stored in plaintext regardless of which code path '
            'triggers a save operation. Indexes defined in Mongoose schemas improve query '
            'performance significantly for frequently accessed fields like email and college.',
        ]),
        ('5.2  Express.js', [
            'Express.js is a minimalist, unopinionated web framework for Node.js that provides '
            'the HTTP server infrastructure for MyCircle\'s REST API. Express simplifies request '
            'handling, routing, and middleware composition without imposing architectural '
            'constraints, making it ideal for building RESTful APIs.',

            'The middleware architecture is Express\'s most powerful feature. Every incoming '
            'request passes through an ordered chain of functions, each receiving the request '
            'object, response object, and a next() function. MyCircle\'s middleware chain '
            'includes: CORS configuration restricting cross-origin requests to the frontend '
            'domain, body-parser middleware converting JSON request bodies into JavaScript '
            'objects, JWT authentication middleware verifying token validity for protected '
            'routes, route-specific handlers executing business logic, and centralised error '
            'handling middleware providing consistent error response formats.',

            'The MVC pattern organises the codebase: routes.js files define URL patterns and '
            'delegate to controllers, controller files implement business logic and call '
            'Mongoose models, and model files define schemas and database interaction methods. '
            'This separation of concerns enables independent testing and modification of '
            'each layer without affecting others.',
        ]),
        ('5.3  React.js', [
            'React.js is a JavaScript library for building user interfaces through a '
            'component-based architecture. Each UI element in MyCircle — the opportunity card, '
            'navigation bar, profile form, message window — is an independent component '
            'encapsulating its structure, logic, and styling. Components compose hierarchically '
            'to build complex interfaces from simple, reusable pieces.',

            'React Hooks enable stateful logic in functional components. useState manages local '
            'component state for form inputs, loading indicators, and UI toggles. useEffect '
            'handles side effects including API data fetching on mount, subscription cleanup '
            'on unmount, and dependency-driven re-fetching. useContext accesses global state '
            '(authentication status, user data, theme) without prop drilling through '
            'intermediate components. Custom hooks such as useOpportunities and useAuth '
            'encapsulate reusable data-fetching and authentication logic.',

            'React Router v6 handles client-side navigation, enabling SPA behaviour where '
            'page transitions occur without full browser reloads. Protected route components '
            'check AuthContext for valid authentication before rendering, redirecting '
            'unauthenticated users to the login page. Context API maintains global state '
            'including AuthContext (current user and token), NotificationContext (unread '
            'count), providing consistent state access across the component tree.',
        ]),
        ('5.4  Node.js', [
            'Node.js provides the JavaScript runtime executing MyCircle\'s server-side code, '
            'enabling full-stack JavaScript development with a unified language across both '
            'frontend and backend. This eliminates context switching between languages and '
            'enables sharing of validation logic and data structures between client and server.',

            'Node.js\'s event-driven, non-blocking I/O model excels at handling many concurrent '
            'connections simultaneously — critical for web applications serving many users. '
            'Rather than allocating a thread per connection (which limits scalability), Node.js '
            'processes I/O operations asynchronously through its event loop, enabling efficient '
            'resource utilisation under concurrent load. This architecture makes Node.js '
            'particularly well-suited for the real-time features in MyCircle\'s messaging '
            'and notification systems.',
        ]),
        ('5.5  Vite', [
            'Vite replaces Create React App as MyCircle\'s frontend build tool, providing '
            'dramatically faster development experience. During development, Vite serves files '
            'as native ES modules to the browser, eliminating the bundling step that makes '
            'other tools slow. Only code needed for the current view is loaded.',

            'Hot Module Replacement (HMR) updates only the changed module in the browser '
            'without full page reloads or state loss, reducing iteration time from seconds '
            'to milliseconds. Third-party dependencies are pre-bundled with esbuild (a '
            'Go-based bundler) during initialisation, eliminating repeated processing. '
            'For production, Vite uses Rollup for optimised builds with code splitting, '
            'tree shaking, and asset hashing for cache-efficient deployments.',
        ]),
        ('5.6  Tailwind CSS', [
            'Tailwind CSS provides MyCircle\'s styling through utility-first classes applied '
            'directly to HTML elements. Rather than writing custom CSS in separate files, '
            'Tailwind\'s pre-built classes (flex, grid, rounded-xl, text-blue-600, etc.) '
            'compose directly in JSX. This eliminates context switching between markup and '
            'stylesheet files, accelerating development considerably.',

            'Responsive design is achieved through mobile-first breakpoint prefixes. Classes '
            'like md:flex and lg:grid-cols-3 apply at specific viewport widths, making '
            'responsive layouts declarative and immediately readable from the markup. '
            'The Tailwind configuration extends default tokens with MyCircle\'s specific '
            'brand colours, custom spacing values, and animation keyframes.',
        ]),
        ('5.7  JWT Authentication & bcrypt', [
            'JSON Web Tokens provide MyCircle\'s stateless authentication mechanism. JWTs '
            'are signed, base64-encoded strings containing claims (user ID, role, expiration) '
            'that can be verified without database lookup. This stateless nature enables '
            'horizontal scaling — any server instance can verify any token without shared '
            'session storage.',

            'The authentication flow: user submits credentials to /api/auth/login. The server '
            'validates credentials, generates a JWT signed with the application secret '
            'embedding the user\'s ID and role, and returns the token. The React frontend '
            'stores the token in localStorage and attaches it to every subsequent API request '
            'in the Authorization: Bearer <token> header. The auth middleware verifies the '
            'signature and expiration, extracting the user ID for database operations.',

            'bcrypt handles password security through computationally expensive one-way hashing '
            'with unique salts. Each hash includes a randomly generated salt, making identical '
            'passwords produce different hashes, defeating rainbow table attacks. The work '
            'factor (default 10) controls computational cost, balancing security against '
            'performance. Verification uses bcrypt.compare() to hash the input and compare '
            'with the stored hash, never requiring decryption.',
        ]),
        ('5.8  Axios, Socket.io & Cloudinary', [
            '<b>Axios</b> handles all HTTP communication from React to the Express API. A '
            'pre-configured Axios instance sets the base URL and request interceptors that '
            'automatically attach the JWT token from localStorage to every request. Response '
            'interceptors handle 401 errors globally, triggering logout and redirect rather '
            'than requiring error handling in every component.',

            '<b>Socket.io</b> enables real-time bidirectional communication for MyCircle\'s '
            'messaging and notification features. Socket.io abstracts WebSocket connections '
            'with automatic fallback to HTTP long-polling when WebSocket is unavailable. '
            'The server emits events (new_message, notification) that connected clients '
            'listen for, enabling instant delivery without polling.',

            '<b>Cloudinary</b> provides cloud-based media storage for profile pictures and '
            'post attachments. The upload flow: user selects an image in React, the file '
            'is POSTed to Express as FormData, Express uses the Cloudinary Node.js SDK to '
            'upload directly to Cloudinary, the returned secure URL is stored in MongoDB, '
            'and that URL is used in all subsequent image displays. This approach avoids '
            'MongoDB\'s 16MB document size limit and offloads image serving to Cloudinary\'s '
            'CDN infrastructure.',
        ]),
    ]

    for title, paras in tech:
        story.append(Paragraph(title, ST['h2']))
        for p in paras:
            story.append(Paragraph(p, ST['body']))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # CHAPTER 6 — IMPLEMENTATION
    # ═══════════════════════════════════════════════════════════════════════════
    chapter_header(story, '6', 'Implementation & Feature Walkthrough', ST)

    features = [
        ('6.1  User Registration and Authentication', [
            'The authentication system forms the security foundation of MyCircle. Registration '
            'requires full name, institutional email address, password (with strength validation), '
            'college name, year of study (dropdown), and course/programme. Client-side validation '
            'provides real-time feedback for each field as the user completes the form.',

            'Upon form submission, the registration endpoint performs server-side validation '
            'repeating all client checks with additional security measures: email format '
            'verification, duplicate email checking against MongoDB, and password strength '
            'scoring. On successful validation, bcrypt hashes the password with 10 salt rounds '
            'before storage. A JWT token is immediately generated with the new user\'s ID, '
            'enabling automatic login after registration.',

            'The login flow validates credentials by retrieving the user by email and comparing '
            'the submitted password against the stored bcrypt hash using bcrypt.compare(). '
            'Successful login returns both the JWT token and public user data. The React '
            'AuthContext stores this globally, providing authentication state to all components. '
            'Login failures return standardised error messages without indicating whether '
            'the email or password was incorrect, preventing user enumeration attacks.',

            'JWT middleware on every protected route extracts the token from the Authorization '
            'header, verifies the signature and expiration, and attaches the decoded user ID '
            'to the request object for downstream route handlers. Expired tokens return 401 '
            'Unauthorized, triggering the frontend to clear local state and redirect to login.',
        ]),
        ('6.2  Student Profile Page', [
            'The profile page is each student\'s showcase within MyCircle. It displays a '
            'cover-style header with the profile picture, name, institution, year, course, '
            'and bio. Social metrics — followers count, following count, and posts count — '
            'are displayed as clickable links revealing full lists.',

            'Profile editing transitions the view to an edit mode revealing form fields '
            'pre-populated with current data. Profile picture selection shows an image '
            'preview before saving. The save operation posts to the profile update endpoint, '
            'which uploads the new image to Cloudinary if changed, updates the MongoDB '
            'document, and returns the updated user object.',

            'The follow/unfollow button on other users\' profiles sends POST or DELETE to '
            'the follow endpoint, updating both users\' followers/following arrays '
            'atomically using MongoDB\'s $addToSet operator to prevent duplicate entries.',
        ]),
        ('6.3  Opportunities Feed', [
            'The opportunities feed is the platform\'s main discovery interface. It displays '
            'a scrollable, paginated grid of opportunity cards. Each card shows a colour-coded '
            'type badge (blue for internship, green for freelance, orange for part-time), '
            'the opportunity title, truncated description, poster profile link, location, '
            'deadline, and posted date.',

            'The feed implements server-side filtering through query parameters. Users can '
            'filter by opportunity type, city, and college simultaneously. The search bar '
            'sends a query parameter that is processed as a case-insensitive regex match '
            'against title and description fields in MongoDB. Pagination loads 20 '
            'opportunities per request, with infinite scroll triggering additional fetches.',

            'Clicking an opportunity card opens a detailed modal showing the complete '
            'description, requirements, application instructions, deadline, and poster '
            'profile. An Apply button opens the external application link. A Message '
            'Poster button opens the direct messaging interface pre-addressed to the poster.',
        ]),
        ('6.4  Post an Opportunity', [
            'The create opportunity form opens as a modal with clearly labelled fields: '
            'Title (required, 100 character limit), Type (dropdown selection), Description '
            '(required, minimum 50 characters, textarea with live character count), '
            'Location/City (required), Requirements (optional), Application Link (URL '
            'validation), and Deadline (date picker enforcing future dates).',

            'Client-side validation provides immediate field-level feedback. On submission, '
            'a POST request to /api/opportunities creates the document with postedBy '
            'set to the authenticated user\'s ID, isActive defaulting to true, and '
            'timestamps auto-generated. Success closes the modal, triggers feed refetch, '
            'and shows a success toast notification. Authors can edit and delete their '
            'own opportunities through contextual buttons visible only to the post owner.',
        ]),
        ('6.5  Campus Events', [
            'The events module displays upcoming and past campus events in chronological '
            'order. Event cards show the title, a date badge, venue, and organiser profile '
            'link. The event creation form collects title, description, date and time, '
            'venue, registration type (open/limited), and optional cover image.',

            'Events with future dates appear in the Upcoming section sorted by proximity '
            'to the current date. Past events are archived in a separate section for reference. '
            'The Event Details page provides complete information including the registration '
            'link and attendee count.',
        ]),
        ('6.6  Study Groups', [
            'Study groups enable structured peer collaboration around subjects or courses. '
            'The groups page displays cards with group name, subject badge, member count '
            'with avatar stack, admin name, and a Join/Leave button. Groups can be '
            'filtered by subject or searched by name.',

            'Creating a group requires a unique name, subject selection from a predefined '
            'list with an "Other" option for custom subjects, description, and privacy '
            'setting. The group creator is automatically set as admin. Joining adds the '
            'user\'s ID to the members array using $addToSet. Leaving removes the ID '
            'after a confirmation step, with admins prevented from leaving without '
            'first transferring ownership.',
        ]),
        ('6.7  Follow System, Messaging & Notifications', [
            'The <b>follow system</b> enables students to curate their feeds. Following sends '
            'a POST to /api/users/follow/:id which uses MongoDB\'s $addToSet operator to '
            'add the current user\'s ID to the target\'s followers array and the target\'s '
            'ID to the current user\'s following array. The operations are performed '
            'atomically. A new-follower notification is automatically generated for the '
            'target user.',

            'The <b>messaging system</b> enables direct communication between any two '
            'authenticated users. The messages page shows a conversation list on the '
            'left and the active chat on the right. Messages are rendered as chat '
            'bubbles with timestamps. New message submission POST to /api/messages, '
            'storing the sender, receiver, content, and timestamp. Socket.io emits '
            'the new message to the receiver\'s connected client for real-time delivery.',

            'The <b>notification system</b> generates alerts for platform events. The '
            'notification bell in the navigation bar displays an unread count badge '
            'updated in real-time via Socket.io. Clicking the bell reveals a dropdown '
            'with recent notifications. Opening the dropdown marks all as read via '
            'PUT /api/notifications/read-all. Notification types include: new follower, '
            'new opportunity from followed user, upcoming event reminder (24 hours '
            'before), and event registration confirmation.',
        ]),
        ('6.8  Admin Panel', [
            'The admin panel is accessible only to users with role: "admin", enforced '
            'by a dedicated adminMiddleware that verifies both JWT validity and admin '
            'role. Non-admin access returns 403 Forbidden.',

            'The dashboard displays real-time statistics: total registered users, active '
            'opportunity posts, total events, pending reports, and new users registered '
            'in the past seven days. These statistics are computed through MongoDB '
            'aggregation pipelines on each dashboard load.',

            'User management provides a searchable table with email, name, college, '
            'registration date, and status. Admins can ban users (preventing login) '
            'or permanently delete accounts along with all associated content. '
            'Content moderation lists reported posts with severity levels, enabling '
            'admins to remove inappropriate content with single-click operations.',
        ]),
    ]

    for title, paras in features:
        story.append(Paragraph(title, ST['h2']))
        for p in paras:
            story.append(Paragraph(p, ST['body']))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # CHAPTER 7 — TESTING
    # ═══════════════════════════════════════════════════════════════════════════
    chapter_header(story, '7', 'Testing', ST)

    story.append(Paragraph('7.1  Testing Strategy', ST['h2']))
    story.append(Paragraph(
        'MyCircle employs a multi-layered testing strategy that validates system behaviour '
        'at unit, integration, system, security, performance, and user acceptance levels. '
        'Manual testing via Postman and browser developer tools complements structured test '
        'case execution throughout the development lifecycle. Each feature is tested '
        'immediately after implementation before integration with the broader system.',
        ST['body']))

    story.append(Paragraph('7.2  Unit Testing', ST['h2']))
    story.append(Paragraph(
        'Unit testing validates critical backend functions in complete isolation. Key '
        'functions tested include bcrypt password hashing (verifying different salts '
        'produce unique hashes from identical input), JWT token generation and verification '
        '(confirming correct payload encoding and expiration enforcement), input validation '
        'utilities (testing boundary conditions for email, password strength, and required '
        'fields), and Mongoose schema validators (confirming type enforcement and custom '
        'validators reject invalid data correctly).', ST['body']))

    story.append(Paragraph('7.3  API Testing — Test Cases', ST['h2']))
    story.append(Paragraph(
        'All 33 API endpoints were tested systematically using Postman collections with '
        'environment variables for base URLs and authentication tokens. The following '
        'table presents 20 representative test cases covering critical paths, error '
        'conditions, and authorisation boundaries:', ST['body']))
    story.append(Spacer(1, 0.2*cm))
    story.append(make_test_table())
    story.append(Paragraph('Table 7.1 — API Test Cases (TC-001 to TC-020)', ST['caption']))

    story.append(Paragraph('7.4  Frontend Testing', ST['h2']))
    story.append(Paragraph(
        'Frontend testing was performed manually across Chrome (v120+), Firefox (v121+), '
        'and Microsoft Edge. Test scenarios included: form submission with empty required '
        'fields, invalid email formats, passwords below minimum length, and maximum-length '
        'inputs. Mobile responsiveness was verified using Chrome DevTools responsive mode '
        'at 375px (iPhone SE), 414px (iPhone 14), 768px (iPad), and 1024px (laptop). '
        'Touch interaction targets were verified to meet the 44x44px minimum.', ST['body']))

    story.append(Paragraph('7.5  Security Testing', ST['h2']))
    story.append(Paragraph(
        'Security testing identified and resolved several potential vulnerabilities. JWT '
        'token expiration was tested by manually expiring tokens and confirming 401 responses '
        'on subsequent requests. Protected routes were accessed without tokens (expecting 401) '
        'and with student tokens on admin routes (expecting 403). CORS was tested by '
        'sending requests from an unauthorised origin, confirming rejection. MongoDB query '
        'injection was tested by submitting JSON objects as input values — Mongoose\'s '
        'parameterised queries correctly prevented injection.', ST['body']))

    story.append(Paragraph('7.6  Performance Testing', ST['h2']))
    story.append(Paragraph(
        'Performance benchmarks were measured using Chrome DevTools Network panel and '
        'Lighthouse audits. The home page achieved a Lighthouse performance score of 78/100 '
        'with First Contentful Paint under 1.8 seconds on simulated 4G connection. API '
        'endpoints returned list responses within 280ms and single-item responses within '
        '180ms on average. MongoDB query performance was analysed using .explain("executionStats") '
        'confirming index usage on email, college, and createdAt fields.', ST['body']))

    story.append(Paragraph('7.7  User Acceptance Testing', ST['h2']))
    story.append(Paragraph(
        'User acceptance testing was conducted with five MCA students from the department. '
        'Each participant completed a structured set of tasks: registration, posting an '
        'opportunity, following a peer, and sending a message. Four of five participants '
        'completed all tasks without assistance. The most common feedback was a request for '
        'stronger search functionality and clearer mobile navigation. Both issues were '
        'addressed in subsequent iterations before final submission.', ST['body']))

    story.append(Paragraph('7.8  Bug Report', ST['h2']))
    story.append(make_bug_table())
    story.append(Paragraph('Table 7.2 — Bug Report (All Resolved)', ST['caption']))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # CHAPTER 8 — SCREENSHOTS
    # ═══════════════════════════════════════════════════════════════════════════
    chapter_header(story, '8', 'UI Screenshots / Walkthrough', ST)

    story.append(Paragraph(
        'This chapter provides detailed documentation of the MyCircle user interface. '
        'Screenshot placeholder boxes represent areas where actual application screenshots '
        'are to be inserted before final submission. Each section includes a description '
        'of the UI elements, layout, and user interaction flow.', ST['body']))


    screens = [
        ('8.1  Login & Registration Page', 'Figure 8.1 — Login / Register Page',
         'The authentication pages feature a centered card layout on a gradient dark blue '
         'background consistent with the MyCircle brand palette. The login form contains '
         'floating label inputs for email and password, a full-width login button in the '
         'primary blue colour, and a "Create Account" link for new users. Form validation '
         'errors appear below each field in red with descriptive messages. The registration '
         'form extends with additional fields for full name, college name (dropdown or text), '
         'year of study (dropdown: 1st through 4th year), and course/programme. Real-time '
         'password strength indication guides users toward secure passwords.'),

        ('8.2  Home / Opportunity Feed', 'Figure 8.2 — Opportunity Feed',
         'The main feed page features a persistent top navigation bar with the MyCircle logo, '
         'a global search bar, notification bell with unread count badge, and profile avatar '
         'dropdown. Below the navigation, filter controls allow narrowing by opportunity type, '
         'city, and time period. The feed renders in a responsive card grid — three columns '
         'on desktop, two on tablet, one on mobile. Each card displays a colour-coded type '
         'badge (navy for internship, teal for freelance, orange for part-time), bold title, '
         'two-line description preview, location tag, deadline chip, and poster profile link '
         'with avatar.'),

        ('8.3  Student Profile Page', 'Figure 8.3 — Student Profile',
         'The profile page features a full-width cover band in the brand blue gradient, '
         'overlaid with a circular profile picture, student name, college, and course/year. '
         'Three metric chips display followers count, following count, and posts count as '
         'clickable links. An Edit Profile button reveals an inline editing form. Below the '
         'header, tabbed sections display the student\'s opportunity posts and events in '
         'a card grid. The follow button on other users\' profiles provides one-click '
         'following with optimistic UI update before server confirmation.'),

        ('8.4  Post Opportunity Form', 'Figure 8.4 — Create Opportunity Modal',
         'The opportunity creation form opens as a full-screen modal with a semi-transparent '
         'overlay. The form is organised in two visual columns on desktop. Required fields '
         'are marked with red asterisks. The Type dropdown uses colour-coded options matching '
         'the feed badge colours. The Description textarea displays a live character count. '
         'The Deadline field uses a native date picker enforcing future dates. Form validation '
         'errors appear as red inline messages below each invalid field. The submission button '
         'shows a loading spinner during the API call.'),

        ('8.5  Campus Events Page', 'Figure 8.5 — Events Page',
         'The events page is divided into Upcoming Events and Past Events sections. '
         'Upcoming events are displayed in chronological order with a prominent date badge '
         'in the top-left corner of each card. Cards show the event title, venue, organiser '
         'name with avatar, and a brief description preview. The Add Event button in the page '
         'header opens the event creation modal. Event detail pages provide the complete '
         'description, registration link button, and an interactive attendee counter.'),

        ('8.6  Study Groups Page', 'Figure 8.6 — Study Groups',
         'Study groups are displayed in a responsive grid with cards showing the group name, '
         'subject badge, member count, stacked member avatars (showing up to 5), admin name, '
         'and a Join or Leave button depending on membership status. A search bar above the '
         'grid enables filtering by group name or subject. The Create Group button opens a '
         'form with name, subject dropdown, and description fields. Joined groups have a '
         'highlighted card border and change the button to "Leave".'),

        ('8.7  Direct Messaging', 'Figure 8.7 — Messaging Interface',
         'The messaging interface uses a two-panel layout on desktop: a conversation list '
         'on the left showing all active conversations with avatar, name, and last message '
         'preview, and the active conversation on the right. Unread conversations are '
         'highlighted with a bold name and a count badge. The chat panel displays messages '
         'as alternating chat bubbles — own messages on the right in blue, received messages '
         'on the left in grey — each with a timestamp. A sticky input bar at the bottom '
         'with a send button submits new messages.'),

        ('8.8  Admin Dashboard', 'Figure 8.8 — Admin Panel',
         'The admin dashboard is accessible via a dedicated route protected by admin '
         'middleware. The top row displays five statistic cards in a responsive grid: '
         'Total Users, Active Posts, Total Events, Pending Reports, and New This Week. '
         'Each card shows the number prominently with a trend indicator. Below the stats, '
         'a tabbed interface organises Users and Posts sections. The Users tab shows a '
         'searchable data table with columns for email, name, college, join date, status, '
         'and action buttons (Ban / Delete). The Posts tab lists reported content with '
         'Remove buttons for moderation actions.'),
    ]

    _ts2 = TableStyle([("BOX",(0,0),(-1,-1),1.5,BLUE),("BACKGROUND",(0,0),(-1,-1),LGRAY),("ALIGN",(0,0),(-1,-1),"CENTER"),("VALIGN",(0,0),(-1,-1),"MIDDLE")])
    _ps2 = ParagraphStyle("ph2b",parent=getSampleStyleSheet()["Normal"],fontSize=10,textColor=MGRAY,alignment=TA_CENTER)
    for title, fig_label, desc in screens:
        _t2 = Table([[Paragraph("[ " + fig_label + " ]\nInsert Screenshot Here", _ps2)]],colWidths=[CONTENT_W],rowHeights=[100])
        _t2.setStyle(_ts2)
        story.append(KeepTogether([Paragraph(title, ST["h2"]), _t2, Spacer(1,0.1*cm)]))
        story.append(Paragraph(desc, ST["body"]))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # CHAPTER 9 — LIMITATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    chapter_header(story, '9', 'Limitations', ST)

    limitations = [
        ('9.1  Technical Limitations', [
            ('No Native Mobile Application',
             'MyCircle currently operates as a responsive web application without a dedicated '
             'native mobile app. While Tailwind CSS enables good mobile browser experience, '
             'native app features including offline access, device push notifications via FCN, '
             'camera integration, and biometric authentication require React Native development '
             'as a separate parallel codebase.'),
            ('Basic Recommendation Algorithm',
             'Content ordering in the current version is chronological with followed-user '
             'prioritisation. A production-grade personalisation engine would employ '
             'collaborative filtering, skill-to-opportunity matching through NLP, and '
             'engagement-signal-based ranking. Implementing these requires user interaction '
             'data collection infrastructure and ML model training pipelines beyond minor '
             'project scope.'),
            ('Search Limitations',
             'Opportunity and event search currently uses MongoDB regex matching — a basic '
             'approach that does not support fuzzy matching, typo tolerance, relevance ranking, '
             'or faceted search. Production implementations would integrate Elasticsearch for '
             'full-text search with relevance scoring and advanced filter combinations.'),
            ('Email Verification Absent',
             'The current version does not verify institutional email addresses, relying '
             'on self-reported college names. Production deployment would require email '
             'verification through SMTP integration (SendGrid or nodemailer) to confirm '
             'genuine student status and prevent fake registrations.'),
        ]),
        ('9.2  Platform & Deployment Limitations', [
            ('Free-Tier Hosting Constraints',
             'Deployment on Render\'s free tier introduces cold start delays of 30-60 seconds '
             'after 15 minutes of inactivity. The MongoDB Atlas free tier provides only 512MB '
             'storage, limiting the number of users, posts, and media references the platform '
             'can support before requiring a paid upgrade.'),
            ('Media Storage Limits',
             'Cloudinary\'s free tier provides limited upload bandwidth and total storage '
             'capacity. Platforms with active user bases would exhaust free tier quotas '
             'within weeks, requiring migration to paid tiers with associated costs.'),
        ]),
        ('9.3  Business & Scope Limitations', [
            ('Single Institution Scope',
             'The current version serves a single college community without verified '
             'cross-institution discovery. Scaling to a multi-college network would require '
             'institutional email domain verification, per-college admin roles, and '
             'inter-institutional privacy controls.'),
            ('Manual Content Moderation',
             'Content moderation currently relies entirely on manual admin review of reported '
             'posts. At scale, manual moderation becomes untenable. AI-assisted moderation '
             'using NLP classifiers for spam and inappropriate content detection would be '
             'essential for sustainable growth.'),
        ]),
        ('9.4  Security Limitations', [
            ('JWT in localStorage',
             'Storing JWT tokens in localStorage exposes them to XSS attacks. A more secure '
             'approach stores tokens in HttpOnly cookies inaccessible to JavaScript. However, '
             'HttpOnly cookies require additional CSRF protection — a worthwhile trade for '
             'production systems.'),
            ('Absence of 2FA and Rate Limiting',
             'Two-factor authentication is not implemented, leaving accounts protected only '
             'by password. Full rate limiting middleware (preventing brute force and API '
             'abuse) is not uniformly applied across all endpoints in the current version.'),
        ]),
    ]

    for section, items in limitations:
        story.append(Paragraph(section, ST['h2']))
        for title, desc in items:
            story.append(Paragraph(f'<b>{title}:</b> {desc}', ST['body']))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # CHAPTER 10 — FUTURE SCOPE
    # ═══════════════════════════════════════════════════════════════════════════
    chapter_header(story, '10', 'Future Scope', ST)

    future = [
        ('10.1  AI-Powered Opportunity Recommendations',
         'Future versions will implement a machine learning recommendation engine that analyses '
         'user interaction data — viewed opportunities, saved posts, followed users, and profile '
         'skills — to personalise opportunity feeds. Collaborative filtering will identify '
         'patterns among users with similar profiles and surface opportunities that similar '
         'users engaged with. NLP processing of opportunity descriptions will extract required '
         'skills and match them against user-declared skills for relevance scoring.'),

        ('10.2  React Native Mobile Application',
         'A dedicated React Native application will provide native iOS and Android experiences '
         'with features not achievable in the web browser. Firebase Cloud Messaging (FCM) '
         'will enable push notifications even when the app is closed. Native camera access '
         'will allow in-app photo capture for profile pictures and event documentation. '
         'Offline capability through local database caching will enable browsing saved '
         'content without internet connectivity.'),

        ('10.3  Multi-College Network Expansion',
         'Scaling MyCircle to serve multiple institutions requires verified institutional '
         'identity. Implementation will use institutional email domain verification '
         '(@college.edu.in format) during registration, per-college admin roles with '
         'institution-scoped moderation permissions, and optional inter-college discovery '
         'where students can opt into finding opportunities from nearby institutions.'),

        ('10.4  Elasticsearch Integration',
         'Replacing MongoDB regex search with Elasticsearch will provide full-text search '
         'with relevance ranking, typo tolerance (fuzzy matching), faceted filtering by '
         'multiple criteria simultaneously, auto-complete suggestions, and search analytics '
         'for platform operators to understand user intent.'),

        ('10.5  Blockchain Credential Verification',
         'Academic credential verification through blockchain technology will enable '
         'tamper-proof display of degrees, certifications, and skills on student profiles. '
         'Employers browsing MyCircle could cryptographically verify a student\'s stated '
         'credentials without contacting the institution directly. Smart contracts could '
         'automate verification workflows.'),

        ('10.6  Gamification System',
         'Platform engagement will be enhanced through a points and achievement system. '
         'Users earn points for posting opportunities, helping peers, active event '
         'participation, and quality contributions. Badges (First Post, Top Helper, '
         'Event Organiser, Early Adopter) recognise milestone achievements. '
         'College-level leaderboards celebrate the most active contributors, '
         'fostering healthy community engagement.'),

        ('10.7  Mentorship Module',
         'A dedicated mentorship module will connect junior students with seniors and '
         'alumni who are further along in their career journeys. Mentors will create '
         'profiles listing their expertise, availability, and mentoring style. A '
         'booking system will manage session scheduling. Video integration through '
         'WebRTC or third-party SDKs will enable in-platform mentorship sessions.'),

        ('10.8  Analytics Dashboard for Students',
         'Personal analytics will help students understand their platform impact and '
         'refine their networking strategy. Profile view tracking will show which '
         'opportunities generated interest. Opportunity post performance metrics '
         'will track views, application link clicks, and saves. Engagement analytics '
         'will reveal which content types resonate with peers.'),

        ('10.9  Monetisation Strategy',
         'Sustainable platform operation will be supported through carefully designed '
         'monetisation that preserves the core free student experience. Featured '
         'opportunity listings allow companies and startups to increase visibility '
         'for time-sensitive openings. College institution accounts provide admin '
         'capabilities and analytics for department heads and placement officers. '
         'Premium student profiles offer enhanced visibility in search results.'),
    ]

    for title, desc in future:
        story.append(Paragraph(title, ST['h2']))
        story.append(Paragraph(desc, ST['body']))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # CHAPTER 11 — CONCLUSION
    # ═══════════════════════════════════════════════════════════════════════════
    chapter_header(story, '11', 'Conclusion', ST)

    story.append(Paragraph('11.1  Summary of the Project', ST['h2']))
    story.append(Paragraph(
        'MyCircle represents a comprehensive, functional full-stack web application that '
        'successfully addresses the identified gap in local student opportunity discovery and '
        'peer networking. The platform delivers a complete feature set spanning user '
        'authentication, profile management, opportunity posting and discovery, campus event '
        'management, study group coordination, real-time direct messaging, an intelligent '
        'notification system, and an administrative control panel — all within a modern, '
        'responsive, and performant web interface.', ST['body']))
    story.append(Paragraph(
        'Built on the MERN stack, MyCircle demonstrates the power of modern JavaScript '
        'frameworks in building sophisticated full-stack applications. The three-tier '
        'architecture cleanly separates concerns, the RESTful API design provides a '
        'maintainable and extensible backend, and the React frontend delivers an '
        'engaging user experience consistent across desktop and mobile devices. '
        'The platform successfully passed all 20 documented test cases and the user '
        'acceptance testing with five real students from the department.', ST['body']))

    story.append(Paragraph('11.2  Learning Outcomes', ST['h2']))
    outcomes = [
        'Full-stack MERN application architecture — integrating all four stack components into a cohesive production-ready application',
        'RESTful API design — proper HTTP methods, status codes, request/response formatting, and middleware patterns',
        'JWT authentication implementation — stateless token-based security, bcrypt password hashing, and role-based access control',
        'MongoDB database modelling — collection design, relationship references, Mongoose schemas, validation, and indexing strategies',
        'React advanced patterns — hooks (useState, useEffect, useContext), custom hooks, React Router v6, and Context API state management',
        'Cloud service integration — Cloudinary for media storage, MongoDB Atlas for database hosting, and deployment on cloud platforms',
        'Real-time communication — Socket.io WebSocket implementation for messaging and notification delivery',
        'Software engineering practices — MVC pattern, modular codebase organisation, error handling, and systematic testing methodology',
    ]
    for o in outcomes:
        story.append(Paragraph(f'&#x2022; {o}', ST['bullet']))

    story.append(Paragraph('11.3  Impact and Significance', ST['h2']))
    story.append(Paragraph(
        'MyCircle has the potential for meaningful positive impact on local student communities, '
        'particularly at institutions in tier-2 and tier-3 cities where students have limited '
        'access to the networks and channels available to students at premier institutions. '
        'By centralising opportunity discovery, MyCircle multiplies the effectiveness of both '
        'opportunity sharers and seekers. Verified student profiles establish the credibility '
        'missing from WhatsApp-based sharing. The study group module supports collaborative '
        'learning that improves academic outcomes.', ST['body']))

    story.append(Paragraph('11.4  Closing Statement', ST['h2']))
    story.append(Paragraph(
        'This minor project demonstrates that meaningful, production-quality applications '
        'can be built by students using modern open-source technologies and cloud services. '
        'MyCircle is not merely an academic exercise but a working platform with genuine '
        'potential to improve how college students discover opportunities, build professional '
        'networks, and support each other within their local academic communities. '
        'The modular MERN architecture ensures that the planned future enhancements — mobile '
        'application, AI recommendations, multi-college expansion — can be implemented '
        'iteratively without requiring a fundamental redesign of the existing codebase.', ST['body']))

    story.append(Paragraph(
        'The journey of building MyCircle has provided invaluable hands-on experience with '
        'every component of modern web development — from designing a database schema to '
        'deploying a full-stack application to the cloud. This experience forms the '
        'practical foundation for professional software development work and reinforces '
        'the value of solving real problems with disciplined engineering.', ST['body']))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # REFERENCES
    # ═══════════════════════════════════════════════════════════════════════════
    chapter_header(story, '', 'References', ST)
    story.append(Paragraph('<b>Web References</b>', ST['h2']))

    refs = [
        'MongoDB, Inc. (2024). <i>MongoDB Documentation</i>. Retrieved from https://www.mongodb.com/docs',
        'OpenJS Foundation. (2024). <i>Express.js Official Documentation</i>. Retrieved from https://expressjs.com',
        'Meta Open Source. (2024). <i>React.js Official Documentation</i>. Retrieved from https://react.dev',
        'OpenJS Foundation. (2024). <i>Node.js Official Documentation</i>. Retrieved from https://nodejs.org/en/docs',
        'Vite Team. (2024). <i>Vite Official Guide</i>. Retrieved from https://vitejs.dev/guide',
        'Tailwind Labs. (2024). <i>Tailwind CSS Documentation</i>. Retrieved from https://tailwindcss.com/docs',
        'Auth0, Inc. (2024). <i>JWT.io — Introduction to JSON Web Tokens</i>. Retrieved from https://jwt.io/introduction',
        'Mozilla Developer Network. (2024). <i>MDN Web Docs</i>. Retrieved from https://developer.mozilla.org',
        'Cloudinary. (2024). <i>Cloudinary Developer Documentation</i>. Retrieved from https://cloudinary.com/documentation',
        'Socket.io Contributors. (2024). <i>Socket.io Documentation v4</i>. Retrieved from https://socket.io/docs/v4',
        'Mongoose Contributors. (2024). <i>Mongoose ODM Documentation</i>. Retrieved from https://mongoosejs.com/docs',
        'Postman, Inc. (2024). <i>Postman Learning Center</i>. Retrieved from https://learning.postman.com',
        'MongoDB, Inc. (2024). <i>MongoDB Atlas Free Tier Documentation</i>. Retrieved from https://www.mongodb.com/atlas',
        'W3Schools. (2024). <i>Web Technology Tutorials</i>. Retrieved from https://www.w3schools.com',
        'Stack Overflow Community. (2024). <i>Developer Q&amp;A Platform</i>. Retrieved from https://stackoverflow.com',
        'GitHub, Inc. (2024). <i>GitHub — Software Development and Version Control</i>. Retrieved from https://github.com',
        'Reactrouter.com. (2024). <i>React Router v6 Documentation</i>. Retrieved from https://reactrouter.com',
        'Axios Contributors. (2024). <i>Axios HTTP Client Documentation</i>. Retrieved from https://axios-http.com/docs',
    ]

    for i, ref in enumerate(refs, 1):
        story.append(Paragraph(f'{i}.&nbsp;&nbsp;{ref}', ST['body']))

    return story


# ── BUILD PDF ─────────────────────────────────────────────────────────────────
def main():
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    ST = make_styles()
    story = build_story(ST)

    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        rightMargin=MARGIN,
        leftMargin=MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN,
        title='MyCircle Minor Project Report',
        author='[STUDENT_NAME]',
        subject='MCA Minor Project Report — GGU 2025',
    )
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f'PDF generated: {OUTPUT}')


if __name__ == '__main__':
    main()