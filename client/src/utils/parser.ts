import { XMLParser } from "fast-xml-parser";

export interface Routine {
  program: string;
  name: string;
}

export interface ProgramTag {
  program: string;
  name: string;
}

export interface ParsedResult {
  routines: Routine[];
  controllerTags: string[];
  programTags: ProgramTag[];
}

export interface ParsedError {
  error: string;
}

export function parseL5X(xml: string): ParsedResult | ParsedError {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      allowBooleanAttributes: true,
      isArray: (tagName) => ['Program', 'Routine', 'Tag'].includes(tagName),
    });

    const parsed = parser.parse(xml);

    // Validate root element
    if (!parsed.RSLogix5000Content) {
      return { error: 'Invalid L5X file: Root element must be RSLogix5000Content' };
    }

    const content = parsed.RSLogix5000Content;
    const routines: Routine[] = [];
    const controllerTags: string[] = [];
    const programTags: ProgramTag[] = [];

    // Extract controller tags
    if (content.Controller?.Tags) {
      const tags = Array.isArray(content.Controller.Tags)
        ? content.Controller.Tags
        : [content.Controller.Tags];
      
      for (const tagGroup of tags) {
        const tagList = Array.isArray(tagGroup.Tag)
          ? tagGroup.Tag
          : tagGroup.Tag
          ? [tagGroup.Tag]
          : [];
        
        for (const tag of tagList) {
          if (tag.Name) {
            controllerTags.push(tag.Name);
          }
        }
      }
    }

    // Extract programs, routines, and program tags
    if (content.Controller?.Programs) {
      const programs = Array.isArray(content.Controller.Programs)
        ? content.Controller.Programs
        : [content.Controller.Programs];

      for (const programGroup of programs) {
        const programList = Array.isArray(programGroup.Program)
          ? programGroup.Program
          : programGroup.Program
          ? [programGroup.Program]
          : [];

        for (const program of programList) {
          const programName = program.Name || 'Unknown';

          // Extract routines
          if (program.Routines) {
            const routineGroups = Array.isArray(program.Routines)
              ? program.Routines
              : [program.Routines];

            for (const routineGroup of routineGroups) {
              const routineList = Array.isArray(routineGroup.Routine)
                ? routineGroup.Routine
                : routineGroup.Routine
                ? [routineGroup.Routine]
                : [];

              for (const routine of routineList) {
                if (routine.Name) {
                  routines.push({
                    program: programName,
                    name: routine.Name,
                  });
                }
              }
            }
          }

          // Extract program tags
          if (program.Tags) {
            const tagGroups = Array.isArray(program.Tags)
              ? program.Tags
              : [program.Tags];

            for (const tagGroup of tagGroups) {
              const tagList = Array.isArray(tagGroup.Tag)
                ? tagGroup.Tag
                : tagGroup.Tag
                ? [tagGroup.Tag]
                : [];

              for (const tag of tagList) {
                if (tag.Name) {
                  programTags.push({
                    program: programName,
                    name: tag.Name,
                  });
                }
              }
            }
          }
        }
      }
    }

    return {
      routines,
      controllerTags,
      programTags,
    };
  } catch (error) {
    return {
      error: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
