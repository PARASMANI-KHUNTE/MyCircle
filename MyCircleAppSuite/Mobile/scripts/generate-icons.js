/* eslint-env node */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const MASTER_ICON = path.join(ROOT_DIR, 'master_icon.png');
const ANDROID_RES_DIR = path.join(ROOT_DIR, 'android', 'app', 'src', 'main', 'res');
const IOS_ASSET_DIR = path.join(ROOT_DIR, 'ios', 'MyCircleMobileBare', 'Images.xcassets', 'AppIcon.appiconset');

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

async function generate() {
    if (!fs.existsSync(MASTER_ICON)) {
        console.error('Master icon not found at', MASTER_ICON);
        process.exit(1);
    }

    console.log('Generating Android Icons...');

    // 1. Android colors.xml
    const valuesDir = path.join(ANDROID_RES_DIR, 'values');
    if (!fs.existsSync(valuesDir)) fs.mkdirSync(valuesDir, { recursive: true });
    const colorsXmlPath = path.join(valuesDir, 'colors.xml');
    const colorsXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0b1120</color>
</resources>
`;
    fs.writeFileSync(colorsXmlPath, colorsXmlContent);

    // 2. Android mipmap-anydpi-v26 adaptive icon xml
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

    // 3. Android Mipmap densities
    for (const [dir, dimensions] of Object.entries(ANDROID_SIZES)) {
        const targetDir = path.join(ANDROID_RES_DIR, dir);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Standard Square Icon
        await sharp(MASTER_ICON)
            .resize(dimensions.icon, dimensions.icon)
            .toFile(path.join(targetDir, 'ic_launcher.png'));

        // Standard Round Icon
        const circleShape = Buffer.from(
            `<svg><circle cx="${dimensions.icon / 2}" cy="${dimensions.icon / 2}" r="${dimensions.icon / 2}" /></svg>`
        );
        await sharp(MASTER_ICON)
            .resize(dimensions.icon, dimensions.icon)
            .composite([{ input: circleShape, blend: 'dest-in' }])
            .toFile(path.join(targetDir, 'ic_launcher_round.png'));

        // Adaptive Foreground (Inner 66.7% safe area on transparent canvas)
        const innerSize = Math.round(dimensions.foreground * 0.72);
        const innerIcon = await sharp(MASTER_ICON)
            .resize(innerSize, innerSize)
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

    // 4. iOS AppIcons
    if (fs.existsSync(IOS_ASSET_DIR)) {
        console.log('Generating iOS Icons...');
        for (const item of IOS_ICONS) {
            await sharp(MASTER_ICON)
                .resize(item.size, item.size)
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

    console.log('App icons generated successfully for Android and iOS!');
}

generate().catch((err) => {
    console.error('Failed to generate icons:', err);
    process.exit(1);
});
