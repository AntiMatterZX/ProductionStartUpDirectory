-- First check if the startup_looking_for table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'startup_looking_for'
    ) THEN
        -- Create the junction table for many-to-many relationship
        CREATE TABLE public.startup_looking_for (
            id SERIAL PRIMARY KEY,
            startup_id UUID NOT NULL,
            option_id INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Add foreign key constraints
        ALTER TABLE public.startup_looking_for
            ADD CONSTRAINT fk_startup_looking_for_startup
            FOREIGN KEY (startup_id) 
            REFERENCES public.startups(id) 
            ON DELETE CASCADE;

        ALTER TABLE public.startup_looking_for
            ADD CONSTRAINT fk_startup_looking_for_option
            FOREIGN KEY (option_id) 
            REFERENCES public.looking_for_options(id) 
            ON DELETE CASCADE;

        -- Add a unique constraint to prevent duplicates
        ALTER TABLE public.startup_looking_for
            ADD CONSTRAINT uq_startup_option 
            UNIQUE (startup_id, option_id);
    ELSE
        -- If table exists but constraints are missing, add them
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_startup_looking_for_startup'
        ) THEN
            ALTER TABLE public.startup_looking_for
                ADD CONSTRAINT fk_startup_looking_for_startup
                FOREIGN KEY (startup_id) 
                REFERENCES public.startups(id) 
                ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_startup_looking_for_option'
        ) THEN
            ALTER TABLE public.startup_looking_for
                ADD CONSTRAINT fk_startup_looking_for_option
                FOREIGN KEY (option_id) 
                REFERENCES public.looking_for_options(id) 
                ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'uq_startup_option'
        ) THEN
            ALTER TABLE public.startup_looking_for
                ADD CONSTRAINT uq_startup_option 
                UNIQUE (startup_id, option_id);
        END IF;
    END IF;

    -- Update the startups table to have gallery_images if not already present
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'startups' 
        AND column_name = 'gallery_images'
    ) THEN
        ALTER TABLE public.startups 
        ADD COLUMN gallery_images TEXT[] DEFAULT '{}';
    END IF;
END
$$; 