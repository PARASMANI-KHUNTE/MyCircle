const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MASTER_ICON = 'master_icon.png';
const ANDROID_RES_DIR = 'android/app/src/main/res';

const SIZES = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
};

async function generate() {
    if (!fs.existsSync(MASTER_ICON)) {
        console.error('Master icon not found!');
        return;
    }

    console.log('Generating icons...');

    for (const [dir, size] of Object.entries(SIZES)) {
        const targetDir = path.join(ANDROID_RES_DIR, dir);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Generate Square Icon
        await sharp(MASTER_ICON)
            .resize(size, size)
            .toFile(path.join(targetDir, 'ic_launcher.png'));

        // Generate Round Icon
        const circleShape = Buffer.from(
            `<svg><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" /></svg>`
        );

        await sharp(MASTER_ICON)
            .resize(size, size)
            .composite([{
                input: circleShape,
                blend: 'dest-in'
            }])
            .toFile(path.join(targetDir, 'ic_launcher_round.png'));

        console.log(`Generated ${size}x${size} icons in ${dir}`);
    }
    console.log('Done!');
}

generate().catch(console.error);
