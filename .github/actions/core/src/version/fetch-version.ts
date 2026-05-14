import { SimpleGit } from 'simple-git';
import { BUILD_TYPE } from '../types/build-type.js';
import { getFileFromDefaultBranch } from '../git/git.js';
import { parsePom } from '../utils/pom.js';
import { fetchPomPath } from '../utils/file.js';

export async function fetchCurrentVersion(
    git: SimpleGit,
    type: BUILD_TYPE,
    files: { pom: string; pkg: string; version: string; py: string },
    defaultBranch: string,
    versionPropertyPath: string
): Promise<string> {

    switch (type) {
        case BUILD_TYPE.MAVEN: {
            const versionPath = JSON.parse(versionPropertyPath);
            const xml = await getFileFromDefaultBranch(git, files.pom,defaultBranch);
            const parsed = await parsePom(xml);
            let oldVersion = fetchPomPath(parsed.pomObject, [...versionPath]).trim();

            if (oldVersion.includes('-SNAPSHOT')) {
                oldVersion = oldVersion.replace('-SNAPSHOT', '');
            }
            return oldVersion;
        }

        case BUILD_TYPE.NPM: {
            const pkg = JSON.parse(await getFileFromDefaultBranch(git, files.pkg,defaultBranch));
            return pkg.version.trim();
        }

        case BUILD_TYPE.VERSION_FILE:
            return (await getFileFromDefaultBranch(git, files.version, defaultBranch)).trim();

        case BUILD_TYPE.PYTHON: {
            const content = await getFileFromDefaultBranch(git, files.py,defaultBranch);
            const m = content.match(/version\s*=\s*"(.*?)"/);
            if (!m) throw new Error(`Version not found in ${files.py}`);
            return m[1];
        }
    }
}
