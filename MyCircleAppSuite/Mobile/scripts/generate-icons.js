/* eslint-env node */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const LOGO_SRC = path.join(ROOT_DIR, 'src', 'assets', 'logo.png');
const MASTER_ICON = path.join(ROOT_DIR, 'master_icon.png');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const ANDROID_RES_DIR = path.join(ROOT_DIR, 'android', 'app', 'src', 'main', 'res');
const IOS_ASSET_DIR = path.join(ROOT_DIR, 'ios', 'MyCircleMobileBare', 'Images.xcassets', 'AppIcon.appiconset');
const WEB_PUBLIC_DIR = path.resolve(ROOT_DIR, '..', 'Web', 'public');

const BG_COLOR = { r: 11, g: 17, b: 32, alpha: 1 }; // #0b1120
const BG_HEX = '#0b1120';

const ANDROID_SIZES = {
    'mipmap-mdpi': { icon: 48, foreground: 108 },
    'mipmap-hdpi': { icon: 72, foreground: 162 },
    'mipmap-xhdpi': { icon: 96, foreground: 216 },
    'mipmap-xxhdpi': { icon: 144, foreground: 324 },
    'mipmap-xxxhdpi': { icon: 192, foreground: 432 },
};

const IOS_ICONS = [
    { name: 'AppIcon-20@2x.png', size: 40, idiom: 'iphone', scale: '2x', pt: '20x20' },
    { name: 'AppIcon-20@3x.png', size: 60, idiom: 'iphone', scale: '3x', pt: '20x20' },
    { name: 'AppIcon-29@2x.png', size: 58, idiom: 'iphone', scale: '2x', pt: '29x29' },
    { name: 'AppIcon-29@3x.png', size: 87, idiom: 'iphone', scale: '3x', pt: '29x29' },
    { name: 'AppIcon-40@2x.png', size: 80, idiom: 'iphone', scale: '2x', pt: '40x40' },
    { name: 'AppIcon-40@3x.png', size: 120, idiom: 'iphone', scale: '3x', pt: '40x40' },
    { name: 'AppIcon-60@2x.png', size: 120, idiom: 'iphone', scale: '2x', pt: '60x60' },
    { name: 'AppIcon-60@3x.png', size: 180, idiom: 'iphone', scale: '3x', pt: '60x60' },
    { name: 'AppIcon-1024.png', size: 1024, idiom: 'ios-marketing', scale: '1x', pt: '1024x1024' },
];

async function createIconWithBackground(size, innerScale = 0.85, isCircle = false) {
    const innerSize = Math.max(1, Math.round(size * innerScale));
    const innerBuffer = await sharp(LOGO_SRC)
        .resize(innerSize, innerSize, { fit: 'contain' })
        .toBuffer();

    let image = sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: BG_COLOR,
        },
    }).composite([{ input: innerBuffer, gravity: 'center' }]);

    if (isCircle) {
        const radius = size / 2;
        const circleSvg = Buffer.from(
            `<svg width="${size}" height="${size}"><circle cx="${radius}" cy="${radius}" r="${radius}" fill="#ffffff" /></svg>`
        );
        image = sharp(await image.png().toBuffer())
            .composite([{ input: circleSvg, blend: 'dest-in' }]);
    }

    return image;
}

async function generate() {
    if (!fs.existsSync(LOGO_SRC)) {
        console.error('Source logo not found at', LOGO_SRC);
        process.exit(1);
    }

    console.log('Generating master icon and shared assets from official logo...');

    // 1. Generate master_icon.png (1024x1024 on #0b1120 background)
    await (await createIconWithBackground(1024, 0.85, false))
        .png()
        .toFile(MASTER_ICON);
    console.log('Generated master_icon.png');

    // 2. Generate assets/icon.png, assets/adaptive-icon.png, assets/favicon.png
    if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

    await (await createIconWithBackground(1024, 0.85, false))
        .png()
        .toFile(path.join(ASSETS_DIR, 'icon.png'));

    // Adaptive icon foreground for Expo: 1024x1024 transparent canvas with centered logo (~72% safe zone)
    const adaptiveInnerSize = Math.round(1024 * 0.72);
    const adaptiveInnerBuffer = await sharp(LOGO_SRC)
        .resize(adaptiveInnerSize, adaptiveInnerSize, { fit: 'contain' })
        .toBuffer();

    await sharp({
        create: {
            width: 1024,
            height: 1024,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite([{ input: adaptiveInnerBuffer, gravity: 'center' }])
        .png()
        .toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));

    // Favicon (192x192 transparent)
    await sharp(LOGO_SRC)
        .resize(192, 192, { fit: 'contain' })
        .png()
        .toFile(path.join(ASSETS_DIR, 'favicon.png'));

    console.log('Generated assets (icon.png, adaptive-icon.png, favicon.png)');

    // 3. Android colors.xml
    const valuesDir = path.join(ANDROID_RES_DIR, 'values');
    if (!fs.existsSync(valuesDir)) fs.mkdirSync(valuesDir, { recursive: true });
    const colorsXmlPath = path.join(valuesDir, 'colors.xml');
    const colorsXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${BG_HEX}</color>
</resources>
`;
    fs.writeFileSync(colorsXmlPath, colorsXmlContent);

    // 4. Android mipmap-anydpi-v26 adaptive icon xml
    const anydpiDir = path.join(ANDROID_RES_DIR, 'mipmap-anydpi-v26');
    if (!fs.existsSync(anydpiDir)) fs.mkdirSync(anydpiDir, { recursive: true });

    const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;
    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml);
    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml);

    // 5. Android Mipmap densities
    console.log('Generating Android Mipmap icons...');
    for (const [dir, dimensions] of Object.entries(ANDROID_SIZES)) {
        const targetDir = path.join(ANDROID_RES_DIR, dir);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Standard Square Icon (solid background with official logo)
        await (await createIconWithBackground(dimensions.icon, 0.85, false))
            .png()
            .toFile(path.join(targetDir, 'ic_launcher.png'));

        // Standard Round Icon (circular masked with official logo)
        await (await createIconWithBackground(dimensions.icon, 0.85, true))
            .png()
            .toFile(path.join(targetDir, 'ic_launcher_round.png'));

        // Adaptive Foreground (Inner 72% safe area on transparent canvas)
        const innerSize = Math.round(dimensions.foreground * 0.72);
        const innerIcon = await sharp(LOGO_SRC)
            .resize(innerSize, innerSize, { fit: 'contain' })
            .toBuffer();

        await sharp({
            create: {
                width: dimensions.foreground,
                height: dimensions.foreground,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        })
            .composite([{ input: innerIcon, gravity: 'center' }])
            .png()
            .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

        console.log(`Generated Android ${dir}: ${dimensions.icon}x${dimensions.icon} & foreground ${dimensions.foreground}x${dimensions.foreground}`);
    }

    // 6. iOS AppIcons
    if (fs.existsSync(IOS_ASSET_DIR)) {
        console.log('Generating iOS Icons...');
        for (const item of IOS_ICONS) {
            await (await createIconWithBackground(item.size, 0.85, false))
                .png()
                .toFile(path.join(IOS_ASSET_DIR, item.name));
            console.log(`Generated iOS ${item.name} (${item.size}x${item.size})`);
        }

        const contentsJson = {
            images: IOS_ICONS.map((item) => ({
                size: item.pt,
                idiom: item.idiom,
                filename: item.name,
                scale: item.scale,
            })),
            info: {
                version: 1,
                author: 'xcode',
            },
        };
        fs.writeFileSync(path.join(IOS_ASSET_DIR, 'Contents.json'), JSON.stringify(contentsJson, null, 2));
    }

    // 7. Web Public assets (apple-touch-icon.png, etc.)
    if (fs.existsSync(WEB_PUBLIC_DIR)) {
        console.log('Generating Web branding icons...');
        await (await createIconWithBackground(180, 0.85, false))
            .png()
            .toFile(path.join(WEB_PUBLIC_DIR, 'apple-touch-icon.png'));
        console.log('Generated Web apple-touch-icon.png (180x180)');
    }

    console.log('All app icons and logos successfully synchronized across Android, iOS, and Web!');
}

generate().catch((err) => {
    console.error('Failed to generate icons:', err);
    process.exit(1);
});
